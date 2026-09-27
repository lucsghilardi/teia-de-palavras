import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

import { type CriancaE2E, prepararCriancaE2E } from "./fixture";
import { botoesGrandes, cabeNaTela, capturar, entrarNoApp, semPalavrasProibidas, tocar } from "./util";

/*
| A Roda ao vivo, com dois navegadores (Teste e a colega Bia) e o educador
| conduzindo pela API do painel: entrar → esperar → seguir a etapa → duplas
| propor/concordar → encerrar. Sem Reverb neste ambiente: os snapshots chegam
| pelo polling de 5 s, por isso as esperas são mais longas.
*/

let crianca: CriancaE2E;
const ESPERA = { timeout: 20_000 };

test.beforeEach(() => {
  crianca = prepararCriancaE2E();
});

/** Sessão do educador do E2E (dono da turma) pelo proxy do painel. */
async function educador(request: APIRequestContext) {
  const login = await request.post("/api/auth/login", {
    data: { email: crianca.educador.email, password: crianca.educador.senha },
  });
  expect(login.ok()).toBeTruthy();

  const turmas = (await (await request.get("/api/proxy/painel/turmas")).json()) as { id: number; codigo: string }[];
  const aulas = (await (await request.get("/api/proxy/painel/aulas?disciplina=portugues")).json()) as { id: number; rotulo: string }[];
  const turma = turmas.find((t) => t.codigo === crianca.codigo);
  const teia = aulas.find((a) => a.rotulo === "TEIA");
  expect(turma && teia).toBeTruthy();

  const abrir = await request.post("/api/proxy/painel/rodas", { data: { turma_id: turma!.id, aula_id: teia!.id } });
  expect(abrir.status()).toBe(201);
  const roda = (await abrir.json()) as { id: number; codigo: string };

  const comandar = async (acao: string, valor?: number) => {
    const r = await request.post(`/api/proxy/painel/rodas/${roda.id}/comandos`, { data: valor === undefined ? { acao } : { acao, valor } });
    expect(r.ok(), `comando ${acao}`).toBeTruthy();
  };
  const duplas = async () => {
    const r = await request.post(`/api/proxy/painel/rodas/${roda.id}/duplas`, { data: { automatico: true } });
    expect(r.ok()).toBeTruthy();

    return (await r.json()) as { duplas: { criancas: { apelido: string }[] }[] };
  };

  return { roda, comandar, duplas };
}

/** Segundo navegador, com o mesmo dispositivo do projeto, para a colega Bia. */
async function navegadorDaBia(context: BrowserContext): Promise<{ contexto: BrowserContext; page: Page }> {
  const contexto = await context.browser()!.newContext({
    ...(test.info().project.use as Record<string, unknown>),
    baseURL: test.info().project.use.baseURL,
  } as Parameters<NonNullable<ReturnType<BrowserContext["browser"]>>["newContext"]>[0]);
  const page = await contexto.newPage();
  await page.goto(`/app/entrar?codigo=${crianca.codigo}`);
  await tocar(page, "Bia");
  await tocar(page, "Lua");
  await expect(page).toHaveURL(/\/app$/);

  return { contexto, page };
}

test("duas crianças entram na roda, seguem o educador, jogam em dupla e terminam a missão juntas", async ({ page, context, request }) => {
  const painel = await educador(request);

  // Teste entra pela Galáxia ("Roda aberta").
  await entrarNoApp(page, crianca);
  const cartao = page.getByRole("button", { name: "Entrar na roda: TEIA", exact: true });
  await expect(cartao).toBeVisible();
  await cartao.tap();
  await expect(page).toHaveURL(/\/app\/roda$/);
  await expect(page.getByRole("region", { name: "Esperando" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Crianças na roda" })).toContainText("Teste");
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "roda-esperando");

  // Bia entra no segundo navegador.
  const bia = await navegadorDaBia(context);
  await tocar(bia.page, "Entrar na roda: TEIA");
  await expect(bia.page.getByRole("region", { name: "Esperando" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Crianças na roda" })).toContainText("Bia", ESPERA);

  // O educador começa: as duas veem a etapa 1 (história).
  await painel.comandar("iniciar");
  for (const p of [page, bia.page]) {
    await expect(p.getByRole("button", { name: "Etapa 1 de 9", exact: true })).toHaveAttribute("aria-current", "step", ESPERA);
  }
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "roda-historia");

  // Duplas automáticas e a etapa 5 (montar palavras): a dupla propõe e confirma.
  const { duplas } = await painel.duplas();
  expect(duplas).toHaveLength(1);
  await painel.comandar("ir_etapa", 5);

  for (const p of [page, bia.page]) {
    await expect(p.getByRole("button", { name: "Etapa 5 de 9", exact: true })).toHaveAttribute("aria-current", "step", ESPERA);
    await expect(p.getByRole("region", { name: "Dupla" })).toBeVisible(ESPERA);
  }

  const proponente = (await page.getByRole("region", { name: "Dupla" }).textContent())?.includes("Sua vez") ? page : bia.page;
  const parceira = proponente === page ? bia.page : page;
  await expect(parceira.getByRole("region", { name: "Dupla" })).toContainText(/Vez de/);
  await capturar(proponente, "roda-dupla-vez");

  await tocar(proponente, "Sílaba TA");
  await tocar(proponente, "Sílaba TU");
  await tocar(proponente, "Formar palavra");
  await expect(proponente.getByRole("region", { name: "Dupla" })).toContainText(/Esperando/);

  await expect(parceira.getByRole("region", { name: "Dupla" })).toContainText("TA-TU", ESPERA);
  await botoesGrandes(parceira.locator("body"));
  await cabeNaTela(parceira);
  await capturar(parceira, "roda-dupla-proposta");
  await tocar(parceira, "Concordo");

  // As duas veem o resultado na faixa da dupla, e a vez passa para quem confirmou.
  await expect(parceira.getByRole("region", { name: "Dupla" })).toContainText(/TATU/, ESPERA);
  await expect(proponente.getByRole("region", { name: "Dupla" })).toContainText(/TATU/, ESPERA);
  await expect(parceira.getByRole("region", { name: "Dupla" })).toContainText(/Sua vez/);
  await semPalavrasProibidas(page);
  await semPalavrasProibidas(bia.page);
  await capturar(proponente, "roda-dupla-certa");

  // Encerrar: as duas veem o fim e a missão fica concluída.
  await painel.comandar("encerrar");
  for (const p of [page, bia.page]) {
    await expect(p.getByRole("region", { name: "Roda encerrada" })).toBeVisible(ESPERA);
  }
  await capturar(page, "roda-fim");
  await tocar(page, "Voltar à Galáxia");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("button", { name: "Planeta Português", exact: true })).toContainText("1 de 5");
  await expect(page.getByRole("button", { name: "Entrar na roda: TEIA", exact: true })).toHaveCount(0);

  await bia.contexto.close();
});
