import type { Metadata } from "next";

import { MapaMissoes } from "@/components/crianca/mapa/mapa-missoes";

export const metadata: Metadata = {
  title: "Mapa de missões · Teia de Palavras",
};

/** Início do app da criança: o mapa de missões. */
export default function MapaPage() {
  return <MapaMissoes />;
}
