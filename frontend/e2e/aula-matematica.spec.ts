import { expect, test, type Page } from "@playwright/test";

import { type CriancaE2E, prepararCriancaE2E } from "./fixture";
import { botao, entrarNoApp, etapaAtual, irParaPlaneta, semPalavrasProibidas, tocar, tocarEnquantoHouver } from "./util";

/*
| A missão de Matemática "Somar para decolar" (5 atividades + conquista) só
| por toques: história em JSON, contar objetos em fileiras de 10, somar com
| ícones, subtrair com reta numérica e problemas de escolha. Um erro de
| propósito na escolha mostra a dica sem nunca dizer "errado".
*/

let crianca: CriancaE2E;

test.beforeEach(() => {
  crianca = prepararCriancaE2E();
});

const TOTAL = 6; // 5 atividades + conquista

/** Resolve o item atual de contar: conta os objetos na tela e toca no número. */
async function contarItem(page: Page) {
  const objetos = await page.locator("[data-objeto]").count();
  expect(objetos).toBeGreaterThan(0);
  await tocar(page, String(objetos));
}

/** Resolve o fato atual de somar/subtrair lendo o fato do data-attribute. */
async function resolverFato(page: Page) {
  const fato = await page.locator("[data-fato]").getAttribute("data-fato");
  const m = /^(\d+)([+-])(\d+)$/.exec(fato ?? "");
  expect(m, `fato inválido: ${fato}`).not.toBeNull();
  const [, a, op, b] = m!;
  const valor = op === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
  await tocar(page, String(valor));
}

/**
 * Resposta de um problema da missão, calculada pelo próprio enunciado
 * ("havia 4 foguetes e chegaram mais 3" / "havia 9 estrelas ... e 5 apagaram"):
 * o teste não depende dos números semeados.
 */
function respostaDoProblema(pergunta: string): number {
  const juntar = /havia (\d+) .*mais (\d+)/i.exec(pergunta);
  if (juntar) return Number(juntar[1]) + Number(juntar[2]);

  const tirar = /havia (\d+) .* e (\d+) apagaram/i.exec(pergunta);
  if (tirar) return Number(tirar[1]) - Number(tirar[2]);

  throw new Error(`enunciado sem padrão conhecido: ${pergunta}`);
}

/** Opções numéricas visíveis da escolha atual. */
async function opcoesDaEscolha(page: Page): Promise<string[]> {
  return (await page.locator("[data-opcao]").allInnerTexts()).map((t) => t.trim());
}

/** Depois de resolver um item: toca "Próximo" se houver outro; senão espera o "Continuar". */
async function proximoOuContinuar(page: Page): Promise<"proximo" | "continuar"> {
  const proximo = botao(page, "Próximo");
  const continuar = botao(page, "Continuar");

  await expect(proximo.or(continuar)).toBeVisible();

  if (await proximo.isVisible()) {
    await proximo.tap();
    return "proximo";
  }

  return "continuar";
}

test("criança completa a missão de Matemática só com toques, com dica no erro", async ({ page }) => {
  await entrarNoApp(page, crianca);

  // Galáxia → planeta Matemática: a missão aparece disponível.
  await irParaPlaneta(page, "Matemática", "matematica");
  const missao = page.getByRole("button", { name: /^Missão \d+ \+ \d+, disponível$/ });
  const rotulo = ((await missao.getAttribute("aria-label")) ?? "").replace(/^Missão (.+), disponível$/, "$1");
  await missao.tap();
  await expect(page).toHaveURL(/\/app\/missao\/\d+$/);

  // 1. História em JSON: páginas → Continuar.
  await etapaAtual(page, 1, TOTAL);
  await tocarEnquantoHouver(page, "Próximo");
  await tocar(page, "Continuar");

  // 2. Contar: três itens, cada um com o número certo de objetos na tela.
  await etapaAtual(page, 2, TOTAL);
  for (let i = 0; i < 3; i++) {
    await contarItem(page);
    if ((await proximoOuContinuar(page)) === "continuar") break;
  }
  await tocar(page, "Continuar");

  // 3. Somar com ícones (fatos gerados): lê o fato e responde.
  await etapaAtual(page, 3, TOTAL);
  for (let i = 0; i < 4; i++) {
    await resolverFato(page);
    if ((await proximoOuContinuar(page)) === "continuar") break;
  }
  await tocar(page, "Continuar");

  // 4. Subtrair com reta numérica.
  await etapaAtual(page, 4, TOTAL);
  for (let i = 0; i < 3; i++) {
    await resolverFato(page);
    if ((await proximoOuContinuar(page)) === "continuar") break;
  }
  await tocar(page, "Continuar");

  // 5. Escolha: erra de propósito, recebe a dica sem "errado", depois acerta.
  //    As respostas saem do enunciado, não de números fixos.
  await etapaAtual(page, 5, TOTAL);
  const enunciado = page.locator("section[aria-label='Escolha'] p").first();
  const primeira = await enunciado.innerText();
  const certa = String(respostaDoProblema(primeira));
  const errada = (await opcoesDaEscolha(page)).find((o) => o !== certa)!;
  await tocar(page, errada);
  await expect(page.getByRole("status")).toBeVisible();
  await semPalavrasProibidas(page);
  await expect(botao(page, "Próximo")).toHaveCount(0);
  await tocar(page, certa);
  await tocar(page, "Próximo");
  await expect(enunciado).not.toHaveText(primeira);
  await tocar(page, String(respostaDoProblema(await enunciado.innerText())));
  await tocar(page, "Continuar");

  // 6. Conquista: missão concluída, pontos e volta ao planeta.
  await etapaAtual(page, 6, TOTAL);
  await expect(page.getByRole("heading", { name: /missão concluída/i })).toBeVisible();
  await semPalavrasProibidas(page);
  await tocar(page, "Voltar ao planeta");
  await expect(page).toHaveURL(/\/app\/planeta\/matematica$/);
  await expect(page.getByRole("button", { name: `Missão ${rotulo}, concluída`, exact: true })).toBeVisible();

  // Na Galáxia, o planeta mostra o progresso e a Matemática sai das missões do dia.
  await tocar(page, "Voltar à Galáxia");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("button", { name: "Planeta Matemática", exact: true })).toContainText("1 de 4");
});
