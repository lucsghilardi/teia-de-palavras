/**
 * Texto como a criança deve vê-lo: caixa alta na Fase 1; minúsculas quando o
 * educador liga "usar letras minúsculas" para ela.
 */
export function exibir(texto: string, minusculas = false): string {
  return minusculas ? texto.toLocaleLowerCase("pt-BR") : texto.toLocaleUpperCase("pt-BR");
}
