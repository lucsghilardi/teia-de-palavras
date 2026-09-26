"use client";

import { createContext, useContext } from "react";

import type { ResultadoResposta } from "@/types/CriancaApp";

/**
 * Quem envia a resposta de uma atividade avaliada. Sem provedor, o hook
 * `useResposta` manda para a missão (`/aulas/{id}/atividades/{ordem}/responder`).
 * A Revisão (e, depois, mini-aulas e a Roda) troca o destino por aqui sem que
 * os componentes das atividades saibam onde estão.
 */
export type EnviarResposta = (ordem: number, resposta: Record<string, unknown>) => Promise<ResultadoResposta>;

const EnvioRespostaContext = createContext<EnviarResposta | null>(null);

export function ProvedorEnvioResposta({ enviar, children }: { enviar: EnviarResposta; children: React.ReactNode }) {
  return <EnvioRespostaContext.Provider value={enviar}>{children}</EnvioRespostaContext.Provider>;
}

export function useEnviarResposta(): EnviarResposta | null {
  return useContext(EnvioRespostaContext);
}
