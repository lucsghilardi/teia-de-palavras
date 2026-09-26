import { expect, type Locator, type Page, test } from "@playwright/test";

import type { CriancaE2E } from "./fixture";

/*
| Ajudantes compartilhados pelos testes de ponta a ponta do app da criança:
| tudo só por toque em elementos achados pelo nome acessível (o mesmo que um
| leitor de tela fala), como uma criança que ainda não lê instruções.
*/

export const botao = (page: Page, nome: string) => page.getByRole("button", { name: nome, exact: true });

/** Toca num botão ou link com esse nome acessível. */
export async function tocar(page: Page, nome: string) {
  const alvo = page.getByRole("button", { name: nome, exact: true }).or(page.getByRole("link", { name: nome, exact: true }));
  await alvo.first().tap();
}

/** Toca "nome" enquanto ele existir (páginas da história, perguntas, itens). */
export async function tocarEnquantoHouver(page: Page, nome: string, maximo = 20) {
  for (let i = 0; i < maximo; i++) {
    const alvo = botao(page, nome);

    if (!(await alvo.isVisible())) return i;

    await alvo.tap();
  }

  throw new Error(`"${nome}" continuou aparecendo depois de ${maximo} toques`);
}

/** Entrada da criança: QR/código da turma → avatar (apelido) → figura secreta → Galáxia. */
export async function entrarNoApp(page: Page, crianca: CriancaE2E) {
  await page.goto(`/app/entrar?codigo=${crianca.codigo}`);
  await tocar(page, crianca.apelido);
  await tocar(page, "Estrela");
  await expect(page).toHaveURL(/\/app$/);
}

/** Da Galáxia para a trilha de um planeta ("Português", "Matemática"...). */
export async function irParaPlaneta(page: Page, nome: string, chave: string) {
  await tocar(page, `Planeta ${nome}`);
  await expect(page).toHaveURL(new RegExp(`/app/planeta/${chave}$`));
}

/** Sem rolagem horizontal da página e o alto-falante sempre visível. */
export async function cabeNaTela(page: Page) {
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

/** Nenhum botão do app da criança menor que 64 px (regra de UX do escopo). */
export async function botoesGrandes(area: Locator) {
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

/** Com E2E_CAPTURAS=1, salva uma imagem de cada tela em test-results/capturas. */
export async function capturar(page: Page, nome: string) {
  if (!process.env.E2E_CAPTURAS) return;

  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/capturas/${test.info().project.name}-${nome}.png` });
}

/** A etapa n está na tela, com botões grandes e sem rolagem lateral. */
export async function etapaAtual(page: Page, n: number, total: number) {
  await expect(page.getByRole("button", { name: `Etapa ${n} de ${total}`, exact: true })).toHaveAttribute("aria-current", "step");
  await botoesGrandes(page.locator("body"));
  await cabeNaTela(page);
  await capturar(page, `etapa-${n}`);
}

/** A tela nunca diz "errado", nem mostra nota ou ranking. */
export async function semPalavrasProibidas(page: Page) {
  const texto = ((await page.locator("body").textContent()) ?? "").toLowerCase();
  expect(texto).not.toMatch(/errad|incorret|ranking|nota\b/);
}
