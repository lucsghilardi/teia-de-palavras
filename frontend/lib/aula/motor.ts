/**
 * Motor do player de aula: estado puro (sem React, sem rede) das 8 etapas.
 *
 *  - `etapaAtual`   a fronteira: a etapa mais adiantada que a criança já liberou (1..8).
 *  - `etapaVisivel` a etapa que está na tela; pode voltar para rever (≤ etapaAtual).
 *  - `concluidas`   etapas já terminadas, em ordem crescente.
 *
 * A rede (POST .../etapas/{n}/concluir) é otimista e fica fora daqui
 * (ver `sincronia.ts`): o motor avança na hora, sem esperar o servidor.
 */
import { normalizarPalavra } from "@/lib/silabas";
import { ETAPAS, type AulaCrianca, type Etapa } from "@/types/CriancaApp";

export const TOTAL_ETAPAS = ETAPAS.length; // 8

export type EstadoAula = {
  aula: AulaCrianca | null;
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
};

export type AcaoAula =
  /** Aula recebida de POST /aulas/{id}/iniciar. */
  | { tipo: "carregar"; aula: AulaCrianca }
  /** Tocar num ícone da trilha. Só vale para etapas já liberadas (≤ etapaAtual). */
  | { tipo: "irPara"; etapa: number }
  /** A criança terminou a etapa `etapa`: libera e mostra a seguinte. */
  | { tipo: "concluirEtapa"; etapa: number }
  /** O servidor confirmou `etapa_atual` (nunca faz a criança voltar). */
  | { tipo: "sincronizar"; etapaAtual: number }
  /** Palavra válida formada na Criação: marca a meta e entra na Teia da aula. */
  | { tipo: "descobrirPalavra"; palavra: string; audio_url: string | null }
  /** POST /aulas/{id}/concluir respondeu. */
  | { tipo: "concluirAula" };

export const estadoInicial: EstadoAula = {
  aula: null,
  etapaAtual: 1,
  etapaVisivel: 1,
  concluidas: [],
};

/** Qualquer número vira uma etapa válida (1..8). */
export function limitarEtapa(n: number): number {
  if (!Number.isFinite(n)) return 1;

  return Math.min(TOTAL_ETAPAS, Math.max(1, Math.trunc(n)));
}

function ehEtapa(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_ETAPAS;
}

function intervalo(de: number, ate: number): number[] {
  const lista: number[] = [];

  for (let i = de; i <= ate; i++) lista.push(i);

  return lista;
}

function unir(lista: number[], novos: number[]): number[] {
  return Array.from(new Set([...lista, ...novos])).sort((a, b) => a - b);
}

export function nomeDaEtapa(n: number): Etapa {
  return ETAPAS[limitarEtapa(n) - 1];
}

export function podeIrPara(estado: EstadoAula, n: number): boolean {
  return estado.aula !== null && ehEtapa(n) && n <= estado.etapaAtual;
}

export function motorAula(estado: EstadoAula, acao: AcaoAula): EstadoAula {
  switch (acao.tipo) {
    case "carregar": {
      const { aula } = acao;

      // Missão já concluída: tudo liberado e ela recomeça do início (rever/rejogar).
      if (aula.status === "concluida") {
        return { aula, etapaAtual: TOTAL_ETAPAS, etapaVisivel: 1, concluidas: intervalo(1, TOTAL_ETAPAS) };
      }

      const etapaAtual = limitarEtapa(aula.etapa_atual);

      return { aula, etapaAtual, etapaVisivel: etapaAtual, concluidas: intervalo(1, etapaAtual - 1) };
    }

    case "irPara":
      return podeIrPara(estado, acao.etapa) ? { ...estado, etapaVisivel: acao.etapa } : estado;

    case "concluirEtapa": {
      const n = acao.etapa;

      if (!estado.aula || !ehEtapa(n) || n > estado.etapaAtual) return estado;

      const proxima = Math.min(TOTAL_ETAPAS, n + 1);

      return {
        ...estado,
        etapaAtual: Math.max(estado.etapaAtual, proxima),
        etapaVisivel: proxima,
        concluidas: unir(estado.concluidas, [n]),
      };
    }

    case "sincronizar": {
      if (!estado.aula) return estado;

      const doServidor = limitarEtapa(acao.etapaAtual);

      if (doServidor <= estado.etapaAtual) return estado;

      return {
        ...estado,
        etapaAtual: doServidor,
        concluidas: unir(estado.concluidas, intervalo(1, doServidor - 1)),
      };
    }

    case "descobrirPalavra": {
      if (!estado.aula) return estado;

      const alvo = normalizarPalavra(acao.palavra);

      if (alvo === "") return estado;

      const aula = estado.aula;
      const jaNaTeia = aula.teia.some((p) => normalizarPalavra(p.palavra) === alvo);

      return {
        ...estado,
        aula: {
          ...aula,
          metas: aula.metas.map((m) =>
            !m.encontrada && normalizarPalavra(m.palavra) === alvo ? { ...m, encontrada: true } : m,
          ),
          teia: jaNaTeia ? aula.teia : [...aula.teia, { palavra: acao.palavra, audio_url: acao.audio_url }],
        },
      };
    }

    case "concluirAula": {
      if (!estado.aula) return estado;

      return {
        ...estado,
        aula: { ...estado.aula, status: "concluida", etapa_atual: TOTAL_ETAPAS },
        etapaAtual: TOTAL_ETAPAS,
        concluidas: intervalo(1, TOTAL_ETAPAS),
      };
    }
  }
}
