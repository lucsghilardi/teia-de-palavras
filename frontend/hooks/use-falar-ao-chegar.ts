"use client";

import { useEffect } from "react";

import { useCriancaOpcional } from "@/context/CriancaContext";
import { falar } from "@/lib/fala";

/**
 * Fala a instrução da tela assim que ela aparece. `null`/vazio = ainda não sei
 * o que dizer (ex.: esperando o perfil carregar). Muda o texto → fala de novo.
 * Respeita a narração automática da criança (desligada: só o alto-falante
 * fala). O navegador pode segurar a voz até o primeiro toque na página; por
 * isso toda tela também tem o BotaoOuvir.
 */
export function useFalarAoChegar(texto: string | null | undefined, audioUrl?: string | null) {
  const automatica = useNarracaoAutomatica();

  useEffect(() => {
    if (!texto || !automatica) return;

    void falar(texto, audioUrl);
  }, [texto, audioUrl, automatica]);
}

/** Preferência da criança (padrão ligada; fora da área logada, sempre ligada). */
export function useNarracaoAutomatica(): boolean {
  return useCriancaOpcional()?.crianca?.narracao_automatica ?? true;
}
