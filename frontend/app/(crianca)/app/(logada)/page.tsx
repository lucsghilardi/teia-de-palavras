import type { Metadata } from "next";

import { Galaxia } from "@/components/crianca/galaxia/galaxia";

export const metadata: Metadata = {
  title: "Galáxia · Teia de Palavras",
};

/** Início do app da criança: a Galáxia (planetas, missões do dia, revisão). */
export default function GalaxiaPage() {
  return <Galaxia />;
}
