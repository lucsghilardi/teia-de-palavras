import { expect, type Locator, type Page, test } from "@playwright/test";

import { type CriancaE2E, prepararCriancaE2E } from "./fixture";

/*
| Critério de aceite da Fase 2: uma criança completa a aula TEIA do início ao
| fim só com toque e áudio, sem precisar ler instruções. O teste só TOCA em
| elementos achados pelo nome acessível (o mesmo que um leitor de tela fala).
*/

let crianca: CriancaE2E;

test.beforeEach(() => {
  crianca = prepararCriancaE2E();
});

const botao = (page: Page, nome: string) => page.getByRole("button", { name: nome, exact: true });

/** Toca num botão ou link com esse nome acessível. */
async function tocar(page: Page, nome: string) {
  const alvo = page.getByRole("button", { name: nome, exact: true }).or(page.getByRole("link", { name: nome, exact: true }));
  await alvo.first().tap();
}

/** Toca "nome" enquanto ele existir (páginas da história, perguntas). */
async function tocarEnquantoHouver(page: Page, nome: string, maximo = 20) {
  for (let i = 0; i < maximo; i++) {
    const alvo = botao(page, nome);

    if (!(await alvo.isVisible())) return i;

    await alvo.tap();
  }

  throw new Error(`"${nome}" continuou aparecendo depois de ${maximo} toques`);
}

async function etapaAtual(page: Page, n: number) {
  await expect(page.getByRole("button", { name: `Etapa ${n} de 8`, exact: true })).toHaveAttribute("aria-current", "step");
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, `etapa-${n}`);
}

/** Sem rolagem horizontal da página e o alto-falante sempre visível. */
async function cabeNaTela(page: Page) {
  const medidas = await page.evaluate(() => {
    const falante = [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Ouvir de novo");
    const r = falante?.getBoundingClientRect();

    return {
      rolagem: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      falanteDentro: r ? r.left >= 0 && r.right <= window.innerWidth : false,
    };
  });

  expect(medidas.rolagem, "a página não pode rolar para o lado").toBeLessThanOrEqual(0);
  expect(medidas.falanteDentro, "o botão Ouvir de novo precisa estar dentro da tela").toBe(true);
}

/** Com E2E_CAPTURAS=1, salva uma imagem de cada tela em test-results/capturas. */
async function capturar(page: Page, nome: string) {
  if (!process.env.E2E_CAPTURAS) return;

  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/capturas/${test.info().project.name}-${nome}.png` });
}

/** Nenhum botão do app da criança menor que 64 px (regra de UX do escopo). */
async function botoesGrandes(area: Locator) {
  const pequenos = await area.getByRole("button").evaluateAll((els) =>
    els
      // O botão de ferramentas do Next (só em desenvolvimento) vive num shadow root.
      .filter((el) => el.getRootNode() === document)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { nome: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "?", w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((b) => Math.min(b.w, b.h) < 64),
  );

  expect(pequenos, `botões menores que 64px: ${JSON.stringify(pequenos)}`).toEqual([]);
}

test("criança completa a missão TEIA só com toques", async ({ page }) => {
  // ---------- Entrada: QR da turma → avatar → figura secreta ----------
  await page.goto(`/app/entrar?codigo=${crianca.codigo.toLowerCase()}`);
  await botoesGrandes(page.locator("body"));
  await tocar(page, crianca.apelido);
  await botoesGrandes(page.locator("body"));
  await capturar(page, "figura-secreta");
  await tocar(page, "Estrela");

  // ---------- Mapa ----------
  await expect(page).toHaveURL(/\/app$/);
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "mapa");
  await expect(page.getByRole("button", { name: "Missão BONECA, bloqueada" }).or(page.getByRole("link", { name: "Missão BONECA, bloqueada" }))).toBeVisible();
  await tocar(page, "Missão TEIA, disponível");
  await expect(page).toHaveURL(/\/app\/missao\/\d+$/);

  // ---------- 1. Missão (história narrada) ----------
  await etapaAtual(page, 1);
  expect(await tocarEnquantoHouver(page, "Próximo")).toBeGreaterThan(0);
  await tocar(page, "Continuar");

  // ---------- 2. Conversa ----------
  await etapaAtual(page, 2);
  await tocarEnquantoHouver(page, "Próxima pergunta");
  await tocar(page, "Continuar");

  // ---------- 3. Palavra geradora ----------
  await etapaAtual(page, 3);
  await tocar(page, "Palavra TEIA");
  await tocar(page, "Continuar");

  // ---------- 4. Palmas silábicas: um toque por sílaba ----------
  await etapaAtual(page, 4);
  await expect(botao(page, "Continuar")).toBeHidden();
  await tocar(page, "Palma");
  await tocar(page, "Palma");
  await expect(botao(page, "Sílaba TEI")).toBeVisible();
  await expect(botao(page, "Sílaba A")).toBeVisible();
  await tocar(page, "Continuar");

  // ---------- 5. Ficha de descoberta ----------
  await etapaAtual(page, 5);
  for (const silaba of ["TA", "TE", "TI", "TO", "TU"]) {
    await expect(botao(page, `Sílaba ${silaba}`)).toBeVisible();
  }
  await tocar(page, "Sílaba TA");
  await tocar(page, "Continuar");

  // ---------- 6. Criação: montar palavras com as peças ----------
  await etapaAtual(page, 6);

  // Tentativa que não existe: dica gentil, nada de "errado".
  await tocar(page, "Sílaba TU");
  await tocar(page, "Sílaba TO");
  await tocar(page, "Sílaba TA");
  await tocar(page, "Formar palavra");
  await expect(page.locator("body")).not.toContainText(/errad|incorret/i);
  await tocar(page, "Apagar");

  await tocar(page, "Sílaba TA");
  await tocar(page, "Sílaba TU");
  await tocar(page, "Formar palavra");
  await expect(botao(page, "Palavra TATU na teia")).toBeVisible();

  await tocar(page, "Sílaba TE");
  await tocar(page, "Sílaba TO");
  await tocar(page, "Formar palavra");
  await expect(botao(page, "Palavra TETO na teia")).toBeVisible();
  await capturar(page, "etapa-6-depois");
  await tocar(page, "Continuar");

  // ---------- 7. Produção: uma frase curta ----------
  await etapaAtual(page, 7);
  await expect(botao(page, "Enviar frase")).toBeDisabled();
  for (const palavra of ["O", "TATU", "TEM", "TETO"]) {
    await tocar(page, `Palavra ${palavra}`);
  }
  await tocar(page, "Ouvir minha frase");
  await tocar(page, "Enviar frase");
  await botoesGrandes(page.locator("body"));
  await capturar(page, "etapa-7-depois");
  await tocar(page, "Continuar");

  // ---------- 8. Conquista: próximo capítulo desbloqueado ----------
  await expect(botao(page, "Próxima missão")).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "etapa-8");
  await expect(botao(page, "Palavra TATU")).toBeVisible();
  await expect(botao(page, "Palavra TETO")).toBeVisible();
  await tocar(page, "Voltar ao mapa");

  // ---------- De volta ao mapa e à Teia ----------
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("button", { name: "Missão TEIA, concluída" }).or(page.getByRole("link", { name: "Missão TEIA, concluída" }))).toBeVisible();
  await expect(page.getByRole("button", { name: "Missão BONECA, disponível" }).or(page.getByRole("link", { name: "Missão BONECA, disponível" }))).toBeVisible();

  await tocar(page, "Minha Teia de Palavras");
  await expect(botao(page, "Palavra TATU")).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "teia");
  await expect(botao(page, "Palavra TETO")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/errad|incorret|ranking|nota/i);
});

test("figura secreta diferente não entra e não diz 'errado'", async ({ page }) => {
  await page.goto(`/app/entrar?codigo=${crianca.codigo}`);
  await tocar(page, crianca.apelido);
  await tocar(page, "Lua");

  await expect(page).toHaveURL(/\/app\/entrar/);
  await expect(page.getByRole("list", { name: "Figuras secretas" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/errad|incorret/i);
});
