// Cliente da API da criança (docs/api-crianca.md). Tudo passa pelo proxy
// /api/crianca-proxy, que injeta o JWT do cookie httpOnly `teia_crianca`.
import { ApiError, UnauthorizedError, type ApiErrorBody } from "./apiError";
import type {
  AulaCrianca,
  Eu,
  Missao,
  Pulso,
  ResultadoConclusao,
  ResultadoProducao,
  ResultadoTentativa,
  Teia,
  TurmaEntrada,
} from "@/types/CriancaApp";

const BASE = "/api/crianca-proxy";

async function ler<T>(res: Response): Promise<T> {
  const texto = await res.text();
  let corpo: unknown = null;

  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new UnauthorizedError();
    }

    const erro = (corpo ?? {}) as ApiErrorBody & Record<string, unknown>;
    throw new ApiError(res.status, erro.message || "Algo não deu certo.", erro);
  }

  return corpo as T;
}

export async function criancaFetch<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const headers = new Headers(opcoes.headers ?? {});
  headers.set("Accept", "application/json");

  if (opcoes.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE}${caminho}`, { ...opcoes, credentials: "same-origin", headers });

  return ler<T>(res);
}

const post = <T>(caminho: string, corpo: unknown = {}) =>
  criancaFetch<T>(caminho, { method: "POST", body: JSON.stringify(corpo) });

// ---------- Entrada ----------

export function buscarTurma(codigo: string) {
  return criancaFetch<TurmaEntrada>(`/turma/${encodeURIComponent(codigo.trim().toUpperCase())}`);
}

/** Lança ApiError com status 422 (figura), 423 (bloqueada) ou 429; `body` traz os detalhes. */
export async function entrar(dados: { codigo_turma: string; crianca_id: number; figura_chave: string }) {
  const res = await fetch("/api/crianca-auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (res.status === 401) {
    // 401 aqui não é sessão vencida: é credencial recusada.
    const corpo = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(401, corpo.message || "Não foi possível entrar.", corpo);
  }

  return ler<{ authenticated: boolean }>(res);
}

export async function sair() {
  await fetch("/api/crianca-auth/logout", { method: "POST", credentials: "same-origin" });
}

// ---------- Perfil, sessão, mapa, Teia ----------

export const buscarEu = () => criancaFetch<Eu>("/eu");
export const pulso = () => post<Pulso>("/sessao/pulso");
export const buscarMapa = () => criancaFetch<{ missoes: Missao[] }>("/mapa");
export const buscarTeia = () => criancaFetch<Teia>("/teia");

// ---------- Aula ----------

export const buscarAula = (id: number) => criancaFetch<AulaCrianca>(`/aulas/${id}`);
export const iniciarAula = (id: number) => post<AulaCrianca>(`/aulas/${id}/iniciar`);

export const concluirEtapa = (id: number, etapa: number) =>
  post<{ etapa_atual: number }>(`/aulas/${id}/etapas/${etapa}/concluir`);

export const tentarPalavra = (id: number, silabas: string[]) =>
  post<ResultadoTentativa>(`/aulas/${id}/tentativas`, { silabas });

export const enviarProducao = (id: number, palavras: string[]) =>
  post<ResultadoProducao>(`/aulas/${id}/producao`, { palavras });

export const concluirAula = (id: number) => post<ResultadoConclusao>(`/aulas/${id}/concluir`);
