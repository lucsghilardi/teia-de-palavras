"use client";

import { useEffect } from "react";

/**
 * Mantém a tela acesa enquanto a aula está aberta (Screen Wake Lock API).
 * Navegador sem suporte ou sem permissão: ignora em silêncio. O navegador
 * solta a trava quando a aba some; pedimos de novo quando ela volta.
 */
export function useWakeLock() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let ativo = true;
    let trava: WakeLockSentinel | null = null;

    const pedir = async () => {
      if (document.visibilityState !== "visible" || (trava && !trava.released)) return;

      try {
        const nova = await navigator.wakeLock.request("screen");

        if (!ativo) {
          void nova.release().catch(() => undefined);

          return;
        }

        trava = nova;
      } catch {
        // sem suporte/permissão (ex.: modo economia de bateria): segue sem trava
      }
    };

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") void pedir();
    };

    void pedir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      void trava?.release().catch(() => undefined);
      trava = null;
    };
  }, []);
}
