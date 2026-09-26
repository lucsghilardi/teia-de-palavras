// Utilitários de texto do CMS: palavras e sílabas são cadastradas em caixa
// alta (Fase 1) e comparadas sem acento, como o backend faz.

export function caixaAlta(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

/** "Árvore" -> "ARVORE" (comparação sem acento, igual à `palavra_normalizada`). */
export function normalizarPalavra(valor: string) {
  return caixaAlta(valor)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "");
}

/** "CA - SA" -> ["CA", "SA"] */
export function separarSilabas(valor: string) {
  return valor
    .split("-")
    .map((parte) => caixaAlta(parte.trim()))
    .filter(Boolean);
}

/** ["CA", "SA"] -> "CA-SA" */
export function juntarSilabas(silabas: string[]) {
  return silabas.join("-");
}

/** As sílabas, juntas, formam a palavra? (acentos ignorados) */
export function silabasFormamPalavra(palavra: string, silabas: string[]) {
  return normalizarPalavra(silabas.join("")) === normalizarPalavra(palavra);
}
