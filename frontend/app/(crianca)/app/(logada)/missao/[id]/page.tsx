import type { Metadata } from "next";

import { PlayerAula } from "@/components/crianca/aula/player-aula";

export const metadata: Metadata = {
  title: "Missão · Teia de Palavras",
};

/** Player da aula (8 etapas). `key` reinicia o player ao ir para outra missão. */
export default async function MissaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PlayerAula key={id} id={Number(id)} />;
}
