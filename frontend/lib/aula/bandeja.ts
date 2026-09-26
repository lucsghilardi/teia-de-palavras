/**
 * Bandeja da Criação (e tira de frase da Produção): lista imutável de peças.
 * Funções puras — sempre devolvem uma nova lista (ou a mesma, se nada mudou).
 */
export const MAX_BANDEJA = 4;

export type Bandeja = readonly string[];

export const BANDEJA_VAZIA: Bandeja = [];

/** Põe a peça no fim. Bandeja cheia (max) fica como está. */
export function adicionar(bandeja: Bandeja, peca: string, max = MAX_BANDEJA): Bandeja {
  if (peca.trim() === "" || bandeja.length >= max) return bandeja;

  return [...bandeja, peca];
}

/** Tira a peça da posição `indice` (índice inválido não muda nada). */
export function remover(bandeja: Bandeja, indice: number): Bandeja {
  if (!Number.isInteger(indice) || indice < 0 || indice >= bandeja.length) return bandeja;

  return bandeja.filter((_, i) => i !== indice);
}

export function limpar(): Bandeja {
  return BANDEJA_VAZIA;
}

/** ["TA","TU"] → "TATU"; com separador " " vira frase: ["O","TATU"] → "O TATU". */
export function texto(bandeja: Bandeja, separador = ""): string {
  return bandeja.join(separador);
}

export function cheia(bandeja: Bandeja, max = MAX_BANDEJA): boolean {
  return bandeja.length >= max;
}

export function vazia(bandeja: Bandeja): boolean {
  return bandeja.length === 0;
}
