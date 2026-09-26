/**
 * Contagem concreta: os objetos aparecem em fileiras de 10 (como as barras
 * de dezena), para a criança contar "de 10 em 10 e depois os que sobram".
 */
export const POR_GRUPO = 10;

export function fileirasDeDez(quantidade: number, porGrupo = POR_GRUPO): number[] {
  const total = Math.max(0, Math.trunc(quantidade));
  const fileiras: number[] = [];

  for (let restante = total; restante > 0; restante -= porGrupo) {
    fileiras.push(Math.min(porGrupo, restante));
  }

  return fileiras;
}

/** "12" → "1 dezena e 2 unidades" (ajuda falada). */
export function dezenasEUnidades(quantidade: number): string {
  const dezenas = Math.floor(quantidade / 10);
  const unidades = quantidade % 10;
  const partes: string[] = [];

  if (dezenas > 0) partes.push(dezenas === 1 ? "1 dezena" : `${dezenas} dezenas`);
  if (unidades > 0 || partes.length === 0) partes.push(unidades === 1 ? "1 unidade" : `${unidades} unidades`);

  return partes.join(" e ");
}
