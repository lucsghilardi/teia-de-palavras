import { defineConfig, devices } from "@playwright/test";

/**
 * Teste de ponta a ponta do app da criança contra o ambiente de
 * desenvolvimento do docker compose (Next em :3005, API em :8005).
 *
 *   docker compose up -d        # na raiz do projeto
 *   npm run test:e2e            # nesta pasta
 *
 * Cada teste zera a turma E2E com `php artisan teia:preparar-e2e`.
 * Sem Docker: E2E_PREPARAR_CMD="php artisan teia:preparar-e2e --json" (roda em
 * backend/laravel) e, se preciso, E2E_CHROMIUM com o caminho de um Chromium local.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3005",
    // Sem download: aponte um Chromium já instalado (ex.: E2E_CHROMIUM=/opt/pw-browsers/chromium).
    // O microfone falso grava um tom no lugar da voz: o gravador de mini-aulas roda de ponta a ponta.
    launchOptions: {
      ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {}),
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
    permissions: ["microphone"],
    locale: "pt-BR",
    // O botão do "próximo passo" pulsa sem parar; sem movimento, o Playwright
    // o considera estável. Também é assim que parte das crianças usa o app.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "tablet", use: { ...devices["iPad (gen 7)"], browserName: "chromium" } },
    { name: "celular", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
});
