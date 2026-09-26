import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JogarMiniAula } from "@/components/crianca/amigos/jogar-mini-aula";

export const metadata: Metadata = {
  title: "Aula de um amigo · Teia de Palavras",
};

/** Ouvir, responder e reagir a uma mini-aula recebida. Id inválido volta à base. */
export default async function EntregaPage({ params }: { params: Promise<{ entrega: string }> }) {
  const { entrega } = await params;
  const id = Number(entrega);

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/app/amigos");
  }

  return <JogarMiniAula entregaId={id} />;
}
