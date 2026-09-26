import { expect, test } from "@playwright/test";

import { type CriancaE2E, prepararCriancaE2E } from "./fixture";
import { botoesGrandes, cabeNaTela, capturar, entrarNoApp, semPalavrasProibidas, tocar } from "./util";

/*
| Base dos amigos, só por toques: a criança de teste recebe uma mini-aula da
| colega Bia (ouve, responde com a mesma política de feedback, reage) e depois
| grava a própria aula com o microfone falso do Chromium.
*/

let crianca: CriancaE2E;

test.beforeEach(() => {
  crianca = prepararCriancaE2E();
});

test("criança joga a aula de uma amiga, reage e grava a própria aula", async ({ page }) => {
  await entrarNoApp(page, crianca);

  // A Galáxia avisa que chegou 1 aula nova.
  const base = page.getByRole("button", { name: "Base dos amigos: 1 nova", exact: true });
  await expect(base).toBeVisible();
  await base.tap();
  await expect(page).toHaveURL(/\/app\/amigos$/);
  await expect(page.getByRole("button", { name: "Aula de Bia: Qual sílaba falta em tatu?", exact: true })).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos");

  // ---------- Ouvir → responder → reagir ----------
  await tocar(page, "Aula de Bia: Qual sílaba falta em tatu?");
  await expect(page).toHaveURL(/\/app\/amigos\/\d+$/);
  await expect(page.getByRole("button", { name: "Ouvir a aula", exact: true })).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-ouvir");
  await tocar(page, "Ouvir a aula");
  await tocar(page, "Responder");

  // Uma sílaba que não é: dica, nada de "errado"; depois a certa.
  await tocar(page, "Sílaba TO");
  await semPalavrasProibidas(page);
  await tocar(page, "Sílaba TU");
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-jogar");
  await tocar(page, "Continuar");

  await expect(page.getByRole("list", { name: "Reações" })).toBeVisible();
  await semPalavrasProibidas(page);
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-reagir");
  await tocar(page, "Top");

  await expect(page).toHaveURL(/\/app\/amigos$/);
  await expect(page.getByRole("button", { name: "Aula de Bia: Qual sílaba falta em tatu?", exact: true })).toContainText(/feita/i);

  // ---------- Dar uma aula: missão → desafio → gravar → enviar ----------
  await tocar(page, "Dar uma aula");
  await expect(page).toHaveURL(/\/app\/amigos\/nova$/);
  await expect(page.getByRole("button", { name: "Português: TEIA", exact: true })).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-missao");
  await tocar(page, "Português: TEIA");

  const desafios = page.getByRole("list", { name: "Desafios" });
  await expect(desafios.getByRole("button").first()).toBeVisible();
  const primeiro = await desafios.getByRole("button").first().getAttribute("aria-label");
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-desafios");

  // "Outro desafio" sorteia uma lista diferente.
  await tocar(page, "Outro desafio");
  await expect(desafios.getByRole("button").first()).not.toHaveAttribute("aria-label", primeiro ?? "");
  await desafios.getByRole("button").first().tap();

  await tocar(page, "Gravar");
  await expect(page.getByRole("button", { name: "Parar", exact: true })).toBeVisible();
  await page.waitForTimeout(1500);
  await tocar(page, "Parar");
  await expect(page.getByRole("button", { name: "Enviar aula", exact: true })).toBeVisible();
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, "amigos-gravar");
  await tocar(page, "Ouvir minha gravação");
  await tocar(page, "Enviar aula");

  await expect(page.getByRole("region", { name: "Aula enviada" })).toBeVisible();
  await expect(page.getByText(/foi para um adulto/i)).toBeVisible();
  await semPalavrasProibidas(page);
  await capturar(page, "amigos-enviada");
  await tocar(page, "Voltar à base dos amigos");

  // Na base, a aula aparece em "Minhas aulas" esperando um adulto.
  await expect(page.getByRole("region", { name: "Minhas aulas" })).toContainText(/esperando um adulto/i);
  await semPalavrasProibidas(page);
});
