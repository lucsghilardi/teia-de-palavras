import { execSync } from "node:child_process";
import path from "node:path";

export type CriancaE2E = { codigo: string; crianca_id: number; apelido: string; figura: string };

/** Cria/zera a turma E2E no backend (docker compose) e devolve os dados da criança de teste. */
export function prepararCriancaE2E(): CriancaE2E {
  const raiz = path.resolve(__dirname, "..", "..");
  const saida = execSync("docker compose exec -T backend php artisan teia:preparar-e2e --json", {
    cwd: raiz,
    encoding: "utf8",
  });
  const linha = saida.trim().split("\n").pop() ?? "{}";

  return JSON.parse(linha) as CriancaE2E;
}
