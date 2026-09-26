/** Fração 0..1 do nível já percorrida (no último nível o anel fica cheio). */
export function progressoDoNivel(xpNoNivel: number, xpParaProximo: number | null): number {
  if (xpParaProximo === null || xpParaProximo <= 0) return 1;

  return Math.min(1, Math.max(0, xpNoNivel / xpParaProximo));
}

/** "faltam 3 pontos para o nível 4" / "você está no nível mais alto". */
export function textoDoNivel(nivel: number, xpNoNivel: number, xpParaProximo: number | null): string {
  if (xpParaProximo === null) return `Você está no nível ${nivel}, o mais alto!`;

  const faltam = Math.max(0, xpParaProximo - xpNoNivel);

  if (faltam === 0) return `Você está no nível ${nivel}.`;

  return `Você está no nível ${nivel}. ${faltam === 1 ? "Falta 1 ponto" : `Faltam ${faltam} pontos`} para o nível ${nivel + 1}.`;
}

export function textoDaSequencia(dias: number): string {
  if (dias <= 0) return "Hoje é o primeiro dia da sua sequência.";

  return dias === 1 ? "1 dia seguido brincando." : `${dias} dias seguidos brincando.`;
}

export function textoDasMedalhas(ganhas: number, total: number): string {
  if (ganhas === 0) return `Você ainda vai ganhar ${total} medalhas.`;

  return `${ganhas} de ${total} medalhas.`;
}
