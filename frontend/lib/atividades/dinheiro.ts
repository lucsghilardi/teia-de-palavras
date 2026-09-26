import type { Moeda } from "@/types/CriancaApp";

/** Soma das moedas escolhidas (ids), ignorando ids desconhecidos. */
export function somaEscolhida(moedas: Moeda[], escolhidas: readonly string[]): number {
  const porId = new Map(moedas.map((m) => [m.id, m.valor]));

  return escolhidas.reduce((soma, id) => soma + (porId.get(id) ?? 0), 0);
}

/** "R$ 7" (inteiros; o app só usa reais cheios). */
export function formatarReais(valor: number): string {
  return `R$ ${valor}`;
}

/** Como falar um valor: "1 real", "7 reais". */
export function falarReais(valor: number): string {
  return valor === 1 ? "1 real" : `${valor} reais`;
}

/** Alterna a moeda na seleção (mesma lista se nada mudou). */
export function alternarMoeda(escolhidas: readonly string[], id: string): string[] {
  return escolhidas.includes(id) ? escolhidas.filter((e) => e !== id) : [...escolhidas, id];
}
