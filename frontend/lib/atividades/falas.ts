/**
 * Como o app lê opções em voz alta. No 1º ano a criança ainda está aprendendo
 * a ler: tudo o que ela precisa escolher também é falado.
 */

/** "a, b ou c": a lista de opções como se fala. */
export function listaComOu(textos: string[]): string {
  const limpos = textos.map((t) => t.trim()).filter((t) => t !== "");

  if (limpos.length <= 1) return limpos[0] ?? "";

  return `${limpos.slice(0, -1).join(", ")} ou ${limpos[limpos.length - 1]}`;
}

/**
 * O que o alto-falante repete numa escolha: a pergunta seguida das opções
 * ("Quem ficou preso? Um robô tatu, o capitão ou a tia?").
 */
export function falaDaPergunta(pergunta: string, opcoes: string[]): string {
  const enunciado = pergunta.trim();
  const lista = listaComOu(opcoes);

  if (lista === "") return enunciado;
  if (enunciado === "") return `${lista}?`;

  return `${/[.?!:]$/.test(enunciado) ? enunciado : `${enunciado}.`} ${lista}?`;
}
