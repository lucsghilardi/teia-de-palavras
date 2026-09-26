/**
 * Motor do player de missão: estado puro (sem React, sem rede) das N
 * atividades mais a tela de conquista.
 *
 *  - `total`        N+1: as atividades da missão e, por último, a conquista.
 *  - `etapaAtual`   a fronteira: a etapa mais adiantada que a criança já liberou (1..total).
 *  - `etapaVisivel` a etapa que está na tela; pode voltar para rever (≤ etapaAtual).
 *  - `concluidas`   etapas já terminadas, em ordem crescente.
 *
 * A rede (POST .../etapas/{n}/concluir) é otimista e fica fora daqui
 * (ver `sincronia.ts`): o motor avança na hora, sem esperar o servidor.
 */
import { normalizarPalavra } from "@/lib/silabas";
import type { Atividade, AulaCrianca } from "@/types/CriancaApp";

export type EstadoAula = {
  aula: AulaCrianca | null;
  total: number;
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
};

export type AcaoAula =
  /** Missão recebida de POST /aulas/{id}/iniciar. */
  | { tipo: "carregar"; aula: AulaCrianca }
  /** Tocar num ícone da trilha. Só vale para etapas já liberadas (≤ etapaAtual). */
  | { tipo: "irPara"; etapa: number }
  /** A criança terminou a etapa `etapa`: libera e mostra a seguinte. */
  | { tipo: "concluirEtapa"; etapa: number }
  /** O servidor confirmou `etapa_atual` (nunca faz a criança voltar). */
  | { tipo: "sincronizar"; etapaAtual: number }
  /** Palavra válida formada: marca a meta e entra na Teia da missão. */
  | { tipo: "descobrirPalavra"; palavra: string; audio_url: string | null }
  /** POST /aulas/{id}/concluir respondeu. */
  | { tipo: "concluirAula" };

export const estadoInicial: EstadoAula = {
  aula: null,
  total: 1,
  etapaAtual: 1,
  etapaVisivel: 1,
  concluidas: [],
};

/** Quantas etapas a missão tem, contando a conquista (N+1). */
export function totalEtapas(aula: Pick<AulaCrianca, "atividades">): number {
  return aula.atividades.length + 1;
}

/** Qualquer número vira uma etapa válida (1..total). */
export function limitarEtapa(n: number, total: number): number {
  const teto = Math.max(1, Math.trunc(total) || 1);

  if (!Number.isFinite(n)) return 1;

  return Math.min(teto, Math.max(1, Math.trunc(n)));
}

function ehEtapa(n: number, total: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= total;
}

function intervalo(de: number, ate: number): number[] {
  const lista: number[] = [];

  for (let i = de; i <= ate; i++) lista.push(i);

  return lista;
}

function unir(lista: number[], novos: number[]): number[] {
  return Array.from(new Set([...lista, ...novos])).sort((a, b) => a - b);
}

/** A atividade na tela, ou null quando a etapa visível é a conquista. */
export function atividadeVisivel(estado: EstadoAula): Atividade | null {
  if (!estado.aula) return null;

  return estado.aula.atividades[estado.etapaVisivel - 1] ?? null;
}

export function ehConquista(estado: EstadoAula): boolean {
  return estado.aula !== null && estado.etapaVisivel === estado.total;
}

export function podeIrPara(estado: EstadoAula, n: number): boolean {
  return estado.aula !== null && ehEtapa(n, estado.total) && n <= estado.etapaAtual;
}

export function motorAula(estado: EstadoAula, acao: AcaoAula): EstadoAula {
  switch (acao.tipo) {
    case "carregar": {
      const { aula } = acao;
      const total = totalEtapas(aula);

      // Missão já concluída: tudo liberado e ela recomeça do início (rever/rejogar).
      if (aula.status === "concluida") {
        return { aula, total, etapaAtual: total, etapaVisivel: 1, concluidas: intervalo(1, total) };
      }

      const etapaAtual = limitarEtapa(aula.etapa_atual, total);

      return { aula, total, etapaAtual, etapaVisivel: etapaAtual, concluidas: intervalo(1, etapaAtual - 1) };
    }

    case "irPara":
      return podeIrPara(estado, acao.etapa) ? { ...estado, etapaVisivel: acao.etapa } : estado;

    case "concluirEtapa": {
      const n = acao.etapa;

      if (!estado.aula || !ehEtapa(n, estado.total) || n > estado.etapaAtual) return estado;

      const proxima = Math.min(estado.total, n + 1);

      return {
        ...estado,
        etapaAtual: Math.max(estado.etapaAtual, proxima),
        etapaVisivel: proxima,
        concluidas: unir(estado.concluidas, [n]),
      };
    }

    case "sincronizar": {
      if (!estado.aula) return estado;

      const doServidor = limitarEtapa(acao.etapaAtual, estado.total);

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

      const nova = { palavra: acao.palavra, audio_url: acao.audio_url };
      const atividades = estado.aula.atividades.map((a): Atividade => {
        if (a.tipo === "montar_palavras") {
          const jaTinha = a.metas.some((m) => normalizarPalavra(m.palavra) === alvo && m.encontrada);
          const novaNaTeia = !jaTinha;

          return {
            ...a,
            metas: a.metas.map((m) =>
              !m.encontrada && normalizarPalavra(m.palavra) === alvo ? { ...m, encontrada: true } : m,
            ),
            teia_total: novaNaTeia ? a.teia_total + 1 : a.teia_total,
          };
        }

        if (a.tipo === "frase") {
          const jaNaTeia = a.teia.some((p) => normalizarPalavra(p.palavra) === alvo);

          return jaNaTeia ? a : { ...a, teia: [...a.teia, nova] };
        }

        return a;
      });

      return { ...estado, aula: { ...estado.aula, atividades } };
    }

    case "concluirAula": {
      if (!estado.aula) return estado;

      return {
        ...estado,
        aula: { ...estado.aula, status: "concluida", etapa_atual: estado.total },
        etapaAtual: estado.total,
        concluidas: intervalo(1, estado.total),
      };
    }
  }
}
