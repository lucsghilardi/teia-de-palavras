import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MapaMissoes } from "@/components/crianca/mapa/mapa-missoes";
import { DISCIPLINAS } from "@/lib/disciplinas";
import type { Disciplina } from "@/types/CriancaApp";

export const metadata: Metadata = {
  title: "Planeta · Teia de Palavras",
};

/** Um planeta: a trilha de missões daquela disciplina. Chave desconhecida volta à Galáxia. */
export default async function PlanetaPage({ params }: { params: Promise<{ disciplina: string }> }) {
  const { disciplina } = await params;

  if (!DISCIPLINAS.some((d) => d.chave === disciplina)) {
    redirect("/app");
  }

  return <MapaMissoes key={disciplina} disciplina={disciplina as Disciplina} />;
}
