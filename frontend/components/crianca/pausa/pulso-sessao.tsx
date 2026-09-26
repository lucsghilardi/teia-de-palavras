"use client";

import { useEffect, useState } from "react";

import { ConvitePausa } from "@/components/crianca/pausa/convite-pausa";
import { useCrianca } from "@/context/CriancaContext";
import { pulso } from "@/services/crianca";

const INTERVALO_MS = 60_000;

/**
 * Batimento da sessão da criança (POST /crianca/sessao/pulso a cada 60 s com a
 * página visível, e uma vez ao montar) e o convite de pausa quando o backend
 * manda `sugerir_pausa` (uma vez por sessão). Erros são ignorados: o pulso
 * nunca pode quebrar a tela da criança.
 */
export function PulsoSessao() {
  const { crianca, sair } = useCrianca();
  const [pausa, setPausa] = useState(false);

  useEffect(() => {
    let ativo = true;

    const bater = async (mesmoEscondida = false) => {
      if (!mesmoEscondida && document.visibilityState !== "visible") return;

      try {
        const resposta = await pulso();

        if (ativo && resposta?.sugerir_pausa) {
          setPausa(true);
        }
      } catch {
        // silencioso de propósito
      }
    };

    void bater(true);
    const relogio = window.setInterval(() => void bater(), INTERVALO_MS);

    return () => {
      ativo = false;
      window.clearInterval(relogio);
    };
  }, []);

  if (!pausa) return null;

  return (
    <ConvitePausa
      minusculas={crianca?.usa_minusculas ?? true}
      onContinuar={() => setPausa(false)}
      onSair={() => {
        setPausa(false);
        void sair();
      }}
    />
  );
}
