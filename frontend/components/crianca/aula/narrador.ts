"use client";

import { useEffect, useState } from "react";

import { falar } from "@/lib/fala";
import type { Conquista } from "@/types/CriancaApp";

/**
 * Narração do player de aula por cima de `lib/fala`.
 *
 * `falar` já interrompe a fala anterior, mas uma SEQUÊNCIA (ex.: "TEI" … "A" …
 * "2 palmas!") continuaria depois de interrompida e atropelaria a fala nova.
 * Aqui cada narração ganha um número; qualquer narração nova (ou um toque no
 * alto-falante) cancela as sequências antigas antes do próximo trecho.
 */
export type Trecho = { texto: string; audio_url?: string | null };

let geracao = 0;

export function cancelarNarracao() {
  geracao++;
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Fala um ou mais trechos. Resolve `true` se terminou sem ser atropelada.
 * Nunca rejeita. `aoTrecho(i)` avisa qual trecho vai ser falado (para destacar).
 */
export async function narrar(
  trechos: Trecho | Trecho[] | string,
  pausaMs = 300,
  aoTrecho?: (indice: number) => void,
): Promise<boolean> {
  const minha = ++geracao;
  const lista = typeof trechos === "string" ? [{ texto: trechos }] : Array.isArray(trechos) ? trechos : [trechos];

  for (let i = 0; i < lista.length; i++) {
    if (geracao !== minha) return false;

    aoTrecho?.(i);

    try {
      await falar(lista[i].texto, lista[i].audio_url ?? null);
    } catch {
      // voz indisponível: segue em frente
    }

    if (i < lista.length - 1) await esperar(pausaMs);
  }

  return geracao === minha;
}

/** "Você ganhou: Primeira palavra!" para cada conquista nova. */
export function falasDeConquistas(conquistas: Conquista[]): Trecho[] {
  return conquistas.map((c) => ({ texto: `Você ganhou uma conquista: ${c.titulo}!` }));
}

/**
 * Na chegada da tela (ou quando `chave` muda — ex.: nova página da história):
 * define o que o alto-falante do topo repete e fala `fala`. Devolve `true`
 * quando a narração acabou, para o próximo botão pulsar. Nada espera por isso:
 * os botões já funcionam durante a fala.
 */
export function useNarracaoDeChegada(
  chave: string | number,
  fala: Trecho[],
  instrucao: Trecho,
  definirInstrucao: (t: Trecho) => void,
): boolean {
  const [narrada, setNarrada] = useState<string | number | null>(null);

  useEffect(() => {
    let ativo = true;

    definirInstrucao(instrucao);

    void narrar(fala).then(() => {
      if (ativo) setNarrada(chave);
    });

    return () => {
      ativo = false;
    };
    // Fala só quando a tela/chave muda, não a cada renderização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return narrada === chave;
}
