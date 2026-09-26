import type { Metadata } from "next";

import { TeiaDePalavras } from "@/components/crianca/teia/teia-de-palavras";

export const metadata: Metadata = {
  title: "Minha Teia de Palavras · Teia de Palavras",
};

export default function TeiaPage() {
  return <TeiaDePalavras />;
}
