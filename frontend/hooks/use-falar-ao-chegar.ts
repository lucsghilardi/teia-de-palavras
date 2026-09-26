"use client";

import { useEffect } from "react";

import { falar } from "@/lib/fala";

/**
 * Fala a instrução da tela assim que ela aparece (a criança ainda não lê).
 * `null`/vazio = ainda não sei o que dizer (ex.: esperando o perfil carregar).
 * Muda o texto → fala de novo. O navegador pode segurar a voz até o primeiro
 * toque na página; por isso toda tela também tem o BotaoOuvir.
 */
export function useFalarAoChegar(texto: string | null | undefined, audioUrl?: string | null) {
  useEffect(() => {
    if (!texto) return;

    void falar(texto, audioUrl);
  }, [texto, audioUrl]);
}
