/**
 * Ajudantes puros sobre o conteúdo da aula (paleta, metas, dicas, frase).
 */
import { normalizarPalavra } from "@/lib/silabas";
import type { AulaCrianca } from "@/types/CriancaApp";

type Peca = AulaCrianca["pecas"][number];
type Meta = AulaCrianca["metas"][number];

/** Paleta da Criação: sem repetição, sílabas desta aula primeiro (ordem original preservada). */
export function organizarPecas(pecas: Peca[]): { daAula: Peca[]; anteriores: Peca[] } {
  const vistas = new Set<string>();
  const unicas = pecas.filter((p) => {
    const chave = normalizarPalavra(p.texto);

    if (chave === "" || vistas.has(chave)) return false;

    vistas.add(chave);

    return true;
  });

  return { daAula: unicas.filter((p) => p.da_aula), anteriores: unicas.filter((p) => !p.da_aula) };
}

export function mesmaPalavra(a: string, b: string): boolean {
  return normalizarPalavra(a) === normalizarPalavra(b);
}

/** Meta ainda escondida: nem veio encontrada da API, nem foi achada agora. */
export function metasPendentes(metas: Meta[], achadasAgora: string[] = []): Meta[] {
  return metas.filter((m) => !m.encontrada && !achadasAgora.some((p) => mesmaPalavra(p, m.palavra)));
}

/** Frase falada pelo botão 💡 da Criação. */
export function dicaDaCriacao(metas: Meta[], achadasAgora: string[] = []): string {
  if (metas.length === 0) {
    return "Junte duas pecinhas e toque no botão verde.";
  }

  const pendente = metasPendentes(metas, achadasAgora).find((m) => m.silabas.length > 0);

  if (!pendente) {
    return "Você achou todas as palavras da missão! Tente inventar outras.";
  }

  return `Tente começar com ${pendente.silabas[0]}.`;
}

/** Palavras da Produção: a Teia da criança + palavrinhas, sem repetir. */
export function palavrasDaProducao(
  teia: AulaCrianca["teia"],
  palavrinhas: string[],
): { palavra: string; audio_url: string | null; palavrinha: boolean }[] {
  const vistas = new Set<string>();
  const lista: { palavra: string; audio_url: string | null; palavrinha: boolean }[] = [];

  for (const item of teia) {
    const chave = normalizarPalavra(item.palavra);

    if (chave !== "" && !vistas.has(chave)) {
      vistas.add(chave);
      lista.push({ palavra: item.palavra, audio_url: item.audio_url, palavrinha: false });
    }
  }

  for (const palavra of palavrinhas) {
    // "E" e "É" são palavras diferentes: aqui a chave mantém o acento.
    const chave = palavra.toLocaleUpperCase("pt-BR").trim();

    if (chave !== "" && !vistas.has(chave)) {
      vistas.add(chave);
      lista.push({ palavra, audio_url: null, palavrinha: true });
    }
  }

  return lista;
}
