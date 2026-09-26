"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(callback: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", callback);

  return () => mq.removeEventListener("change", callback);
}

/** true quando o sistema pede menos animação: sem confete, sem balanço. */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
