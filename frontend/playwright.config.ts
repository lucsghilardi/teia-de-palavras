import { defineConfig, devices } from "@playwright/test";

/**
 * Teste de ponta a ponta do app da criança contra o ambiente de
 * desenvolvimento do docker compose (Next em :3005, API em :8005).
 *
 *   docker compose up -d        # na raiz do projeto
 *   npm run test:e2e            # nesta pasta
 *
 * Cada teste zera a turma E2E com `php artisan teia:preparar-e2e`.
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
