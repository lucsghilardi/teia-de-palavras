// A Roda — docs/api-roda.md. Educador via /api/proxy, criança via /api/crianca-proxy.
import { apiFetch } from "@/services/api";
import { criancaFetch } from "@/services/crianca";
import type { ResultadoProducao, ResultadoResposta, ResultadoTentativa } from "@/types/CriancaApp";
import type { ComandoRoda, DuplaEstado, RodaAberta, RodaCrianca, RodaEstado, RodaPainel } from "@/types/Roda";

const json = (corpo: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(corpo) });

// ---------- Educador ----------

export const listarRodas = () => apiFetch<RodaEstado[]>("/painel/rodas");

export const abrirRoda = (turmaId: number, aulaId: number) =>
  apiFetch<RodaEstado>("/painel/rodas", json({ turma_id: turmaId, aula_id: aulaId }));

export const buscarRodaPainel = (id: number) => apiFetch<RodaPainel>(`/painel/rodas/${id}`);

export const comandarRoda = (id: number, comando: ComandoRoda) =>
  apiFetch<RodaEstado>(`/painel/rodas/${id}/comandos`, json(comando));

export const definirDuplas = (id: number, corpo: { pares: [number, number][] } | { automatico: true }) =>
  apiFetch<{ roda: RodaEstado; duplas: DuplaEstado[] }>(`/painel/rodas/${id}/duplas`, json(corpo));

// ---------- Criança ----------

export const rodaAbertaParaMim = () => criancaFetch<{ roda: RodaAberta | null }>("/roda");

export const entrarNaRoda = (codigo?: string) => criancaFetch<RodaCrianca>("/rodas/entrar", json(codigo ? { codigo } : {}));

export const buscarRodaCrianca = (id: number) => criancaFetch<RodaCrianca>(`/rodas/${id}`);

export const sairDaRoda = (id: number) => criancaFetch<{ ok: boolean }>(`/rodas/${id}/sair`, json({}));

export const proporNaDupla = (id: number, resposta: Record<string, unknown>) =>
  criancaFetch<DuplaEstado>(`/rodas/${id}/dupla/propor`, json(resposta));

export const responderNaDupla = (id: number, aceitar: boolean) =>
  criancaFetch<DuplaEstado>(`/rodas/${id}/dupla/responder`, json({ aceitar }));

export const tentarNaRoda = (id: number, silabas: string[]) =>
  criancaFetch<ResultadoTentativa>(`/rodas/${id}/tentativas`, json({ silabas }));

export const responderNaRoda = (id: number, ordem: number, resposta: Record<string, unknown>) =>
  criancaFetch<ResultadoResposta>(`/rodas/${id}/atividades/${ordem}/responder`, json(resposta));

export const producaoNaRoda = (id: number, palavras: string[]) =>
  criancaFetch<ResultadoProducao>(`/rodas/${id}/producao`, json({ palavras }));
