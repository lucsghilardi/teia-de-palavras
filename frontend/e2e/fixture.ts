import { execSync } from "node:child_process";
import path from "node:path";

export type CriancaE2E = { codigo: string; crianca_id: number; apelido: string; figura: string };

const COMANDO_PADRAO = "docker compose exec -T backend php artisan teia:preparar-e2e --json";

/**
 * Cria/zera a turma E2E no backend e devolve os dados da criança de teste.
 * Por padrão usa o compose de desenvolvimento; `E2E_PREPARAR_CMD` troca o
 * comando (ex.: `php artisan teia:preparar-e2e --json` rodando sem Docker) e
 * `E2E_PREPARAR_CWD` a pasta onde ele roda (padrão: raiz do repositório, ou
 * `backend/laravel` quando o comando começa com `php`).
 */
export function prepararCriancaE2E(): CriancaE2E {
  const raiz = path.resolve(__dirname, "..", "..");
  const comando = process.env.E2E_PREPARAR_CMD?.trim() || COMANDO_PADRAO;
  const cwd =
    process.env.E2E_PREPARAR_CWD?.trim() ||
    (comando.startsWith("php") ? path.join(raiz, "backend", "laravel") : raiz);
  const saida = execSync(comando, { cwd, encoding: "utf8" });
  const linha = saida.trim().split("\n").pop() ?? "{}";

  return JSON.parse(linha) as CriancaE2E;
}
