import type { Metadata } from "next";

import { PainelEu } from "@/components/crianca/eu/painel-eu";

export const metadata: Metadata = {
  title: "Eu · Teia de Palavras",
};

/** Nível, sequência e medalhas da criança. */
export default function EuPage() {
  return <PainelEu />;
}
