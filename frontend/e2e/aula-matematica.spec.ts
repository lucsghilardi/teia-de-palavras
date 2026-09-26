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
  await tocar(page, "Missão 7 + 5, disponível");
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

  // 5. Escolha: erra de propósito ("12"), recebe a dica sem "errado", depois acerta ("14").
  await etapaAtual(page, 5, TOTAL);
  await tocar(page, "12");
  await expect(page.getByRole("status").filter({ hasText: "Some 8 com 6." })).toBeVisible();
  await semPalavrasProibidas(page);
  await expect(botao(page, "Próximo")).toHaveCount(0);
  await tocar(page, "14");
  await tocar(page, "Próximo");
  await tocar(page, "10");
  await tocar(page, "Continuar");

  // 6. Conquista: missão concluída, pontos e volta ao planeta.
  await etapaAtual(page, 6, TOTAL);
  await expect(page.getByRole("heading", { name: /missão concluída/i })).toBeVisible();
  await semPalavrasProibidas(page);
  await tocar(page, "Voltar ao planeta");
  await expect(page).toHaveURL(/\/app\/planeta\/matematica$/);
  await expect(page.getByRole("button", { name: "Missão 7 + 5, concluída", exact: true })).toBeVisible();

  // Na Galáxia, o planeta mostra o progresso e a Matemática sai das missões do dia.
  await tocar(page, "Voltar à Galáxia");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("button", { name: "Planeta Matemática", exact: true })).toContainText("1 de 3");
});
