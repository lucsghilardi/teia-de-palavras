import type { Metadata } from "next";

import { BaseDosAmigos } from "@/components/crianca/amigos/base-dos-amigos";

export const metadata: Metadata = {
  title: "Base dos amigos · Teia de Palavras",
};

/** Aulas recebidas dos amigos e as próprias aulas. */
export default function AmigosPage() {
  return <BaseDosAmigos />;
}
