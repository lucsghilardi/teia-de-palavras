import { expect, test } from "@playwright/test";

import { type CriancaE2E, prepararCriancaE2E } from "./fixture";
import { botoesGrandes, cabeNaTela, capturar, entrarNoApp, semPalavrasProibidas, tocar } from "./util";

/*
| Revisão espaçada e a tela "eu", só por toques: a criança de teste chega com
| um item vencido (7 + 5), resolve a sessão, vê o resumo sem nota e depois
| abre o próprio painel com nível, sequência e medalhas.
*/

let crianca: CriancaE2E;

test.beforeEach(() => {
  crianca = prepararCriancaE2E();
});

test("criança faz a Revisão do dia e vê o próprio painel", async ({ page }) => {
  await entrarNoApp(page, crianca);

  // Na Galáxia, a Revisão avisa que há 1 item para hoje.
  const revisao = page.getByRole("button", { name: "Revisão: 1 item para hoje", exact: true });
  await expect(revisao).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await revisao.tap();
  await expect(page).toHaveURL(/\/app\/revisao$/);

  // O item vencido é o fato 7 + 5: erra de propósito, vê a resposta (sem "errado") e segue.
  const fato = await page.locator("[data-fato]").getAttribute("data-fato");
  expect(fato).toBe("7+5");
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "revisao-item");

  const errada = page.locator("[data-opcao]").filter({ hasNot: page.getByText("12", { exact: true }) }).first();
  await errada.tap();
  await semPalavrasProibidas(page);
  await tocar(page, "Continuar");

  // Resumo: quantos itens, sem nota.
  await expect(page.getByRole("region", { name: "Revisão feita" })).toBeVisible();
  await expect(page.getByText(/você revisou 1 item/i)).toBeVisible();
  await semPalavrasProibidas(page);
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "revisao-fim");

  await tocar(page, "Voltar à Galáxia");
  await expect(page).toHaveURL(/\/app$/);

  // O item errado volta para amanhã: hoje a Revisão fica em dia.
  await expect(page.getByRole("button", { name: "Revisão em dia", exact: true })).toBeVisible();

  // Tela "eu": nível, sequência, atalho da revisão e todas as medalhas (ainda por ganhar).
  await tocar(page, "Meu perfil");
  await expect(page).toHaveURL(/\/app\/eu$/);
  await expect(page.getByRole("img", { name: /^Nível \d+$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /dia seguido/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Medalhas" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Medalha .*ainda por ganhar$/ }).first()).toBeVisible();
  await semPalavrasProibidas(page);
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "eu");

  await tocar(page, "Voltar à Galáxia");
  await expect(page).toHaveURL(/\/app$/);
});
