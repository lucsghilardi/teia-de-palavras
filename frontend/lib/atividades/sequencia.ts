/**
 * Ordenar por toque: a criança toca nos itens na ordem que acha certa; eles
 * saem do "monte" e entram na sequência. Tocar num item da sequência devolve
 * ele (e os que vieram depois) ao monte.
 */
export type Sequencia = readonly string[];

export function escolher(sequencia: Sequencia, id: string, disponiveis: readonly string[]): Sequencia {
  if (!disponiveis.includes(id) || sequencia.includes(id)) return sequencia;

  return [...sequencia, id];
}

export function devolver(sequencia: Sequencia, id: string): Sequencia {
  const indice = sequencia.indexOf(id);

  return indice < 0 ? sequencia : sequencia.slice(0, indice);
}

export function completa(sequencia: Sequencia, total: number): boolean {
  return total > 0 && sequencia.length === total;
}

/** Ids que ainda estão no monte, na ordem em que a tela os mostra. */
export function restantes(sequencia: Sequencia, todos: readonly string[]): string[] {
  return todos.filter((id) => !sequencia.includes(id));
}
