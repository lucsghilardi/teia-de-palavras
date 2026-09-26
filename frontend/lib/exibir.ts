/**
 * Como a criança vê o texto.
 *
 * `usa_minusculas` (por criança, no painel) significa "texto como escrito":
 * as frases aparecem como foram digitadas (caso natural) e as peças/palavras
 * de Português, guardadas em caixa alta no banco, aparecem em minúsculas.
 * Desligado, tudo vai para caixa alta (leitores iniciantes, Fase 1).
 */
export function exibir(texto: string, comoEscrito = true): string {
  return comoEscrito ? texto : texto.toLocaleUpperCase("pt-BR");
}

/** Peças de sílaba, palavras da Teia e rótulos de missão (o conteúdo vem em caixa alta). */
export function exibirPalavra(texto: string, comoEscrito = true): string {
  return comoEscrito ? texto.toLocaleLowerCase("pt-BR") : texto.toLocaleUpperCase("pt-BR");
}
