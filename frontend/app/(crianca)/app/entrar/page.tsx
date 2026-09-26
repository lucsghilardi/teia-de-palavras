import type { Metadata } from "next";
import { Suspense } from "react";

import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { EntradaCrianca } from "@/components/crianca/entrada/entrada-crianca";

export const metadata: Metadata = {
  title: "Entrar · Teia de Palavras",
};

/** Pareamento do dispositivo (código da turma) + entrada da criança. */
export default function EntrarPage() {
  // useSearchParams (o `?codigo=` do QR) precisa de um Suspense acima.
  return (
    <Suspense fallback={<TelaCarregando />}>
      <EntradaCrianca />
    </Suspense>
  );
}
