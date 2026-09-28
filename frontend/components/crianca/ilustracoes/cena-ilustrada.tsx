"use client";

import dynamic from "next/dynamic";

import type { ChaveIlustracao } from "@/components/crianca/ilustracoes/catalogo";

/**
 * Carrega as cenas (cenas.tsx) só quando a primeira aparece: o resto do app
 * não paga pelo desenho. Enquanto carrega, fica o fundo do quadro.
 */
const CenaPorChave = dynamic(() => import("@/components/crianca/ilustracoes/cenas").then((m) => m.CenaPorChave), {
  ssr: false,
  loading: () => null,
});

export function CenaIlustrada({ chave }: { chave: ChaveIlustracao }) {
  return <CenaPorChave chave={chave} />;
}
