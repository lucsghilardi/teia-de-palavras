"use client";

import { createContext, useContext } from "react";

import type { ResultadoProducao, ResultadoResposta, ResultadoTentativa } from "@/types/CriancaApp";

/**
 * Quem envia a resposta de uma atividade avaliada. Sem provedor, o hook
 * `useResposta` manda para a missão (`/aulas/{id}/atividades/{ordem}/responder`).
 * A Revisão, as mini-aulas e a Roda trocam o destino por aqui sem que os
 * componentes das atividades saibam onde estão.
 */
export type EnviarResposta = (ordem: number, resposta: Record<string, unknown>) => Promise<ResultadoResposta>;

/** Idem para as atividades legadas de Português: tentar uma palavra e enviar a frase. */
export type TentarPalavra = (silabas: string[]) => Promise<ResultadoTentativa>;
export type EnviarProducao = (palavras: string[]) => Promise<ResultadoProducao>;

const EnvioRespostaContext = createContext<EnviarResposta | null>(null);
const TentativaContext = createContext<TentarPalavra | null>(null);
const ProducaoContext = createContext<EnviarProducao | null>(null);

export function ProvedorEnvioResposta({
  enviar,
  tentar,
  producao,
  children,
}: {
  enviar: EnviarResposta;
  tentar?: TentarPalavra;
  producao?: EnviarProducao;
  children: React.ReactNode;
}) {
  return (
    <EnvioRespostaContext.Provider value={enviar}>
      <TentativaContext.Provider value={tentar ?? null}>
        <ProducaoContext.Provider value={producao ?? null}>{children}</ProducaoContext.Provider>
      </TentativaContext.Provider>
    </EnvioRespostaContext.Provider>
  );
}

export function useEnviarResposta(): EnviarResposta | null {
  return useContext(EnvioRespostaContext);
}

export function useTentarPalavra(): TentarPalavra | null {
  return useContext(TentativaContext);
}

export function useEnviarProducao(): EnviarProducao | null {
  return useContext(ProducaoContext);
}
