import type { Metadata } from "next";

import { RodaCrianca } from "@/components/crianca/roda/roda-crianca";

export const metadata: Metadata = {
  title: "Roda · Teia de Palavras",
};

/** A Roda ao vivo. `?codigo=` (QR do painel) entra na roda de uma turma amiga. */
export default async function RodaPage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;

  return <RodaCrianca key={codigo ?? ""} codigo={codigo?.trim() || null} />;
}
