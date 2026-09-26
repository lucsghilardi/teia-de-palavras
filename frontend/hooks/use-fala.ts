"use client";

import { useEffect, useState } from "react";

import { aoMudarFala, falar, falarEmSequencia, parar } from "@/lib/fala";

/** Acesso à voz do app + estado "está falando agora" (para animar o alto-falante). */
export function useFala() {
  const [falando, setFalando] = useState(false);

  useEffect(() => aoMudarFala(setFalando), []);

  // Sair da tela corta a fala, para não "vazar" narração para a próxima etapa.
  useEffect(() => () => parar(), []);

  return { falar, falarEmSequencia, parar, falando };
}
