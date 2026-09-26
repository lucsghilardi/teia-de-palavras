import type { Metadata } from "next";

import { SessaoRevisao } from "@/components/crianca/revisao/sessao-revisao";

export const metadata: Metadata = {
  title: "Revisão · Teia de Palavras",
};

/** A Revisão do dia (revisão espaçada). */
export default function RevisaoPage() {
  return <SessaoRevisao />;
}
