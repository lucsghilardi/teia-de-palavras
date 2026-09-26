import type { Metadata } from "next";
import { Suspense } from "react";

import { NovaMiniAula } from "@/components/crianca/amigos/nova-mini-aula";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";

export const metadata: Metadata = {
  title: "Dar uma aula · Teia de Palavras",
};

/** Gravar uma mini-aula (`?aula=` escolhe a missão de origem). */
export default function NovaMiniAulaPage() {
  return (
    <Suspense fallback={<TelaCarregando />}>
      <NovaMiniAula />
    </Suspense>
  );
}
