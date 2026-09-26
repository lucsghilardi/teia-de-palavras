"use client";

import { useCallback, useState } from "react";

import { celebrar } from "@/components/crianca/aula/celebrar";
import { falasDeConquistas, narrar } from "@/components/crianca/aula/narrador";
import { useTratarSessao } from "@/components/crianca/aula/sessao";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { sons } from "@/lib/sons";
import { responderAtividade } from "@/services/crianca";
import type { AulaCrianca, Atividade, Conquista, ResultadoResposta } from "@/types/CriancaApp";

export type EstadoItem = {
  resolvido: boolean;
  correta: boolean;
  tentativas: number;
  dica: string | null;
  respostaCorreta: unknown;
  /** Última opção/valor tocado (para a tela apagar o que não deu certo). */
  ultima: unknown;
};

export const FALA_FALHA_REDE = "não consegui conferir agora. vamos tentar de novo?";

/**
 * Política de feedback das atividades avaliadas, para todos os tipos:
 * acerto → comemoração + XP; 1º erro → mensagem curta + dica; 2º erro → a
 * resposta certa (quem chama descreve como falar) e o item fica resolvido.
 */
export function useResposta({
  aula,
  atividade,
  mostrarConquistas,
  descreverResposta,
}: {
  aula: AulaCrianca;
  atividade: Atividade;
  mostrarConquistas: (conquistas: Conquista[]) => void;
  /** Como falar `resposta_correta` na 2ª tentativa (ex.: "a resposta é 12"). */
  descreverResposta?: (respostaCorreta: unknown) => string | null;
}) {
  const { atualizar } = useCrianca();
  const tratarSessao = useTratarSessao();
  const reduzido = useMovimentoReduzido();
  const [estados, setEstados] = useState<Record<string, EstadoItem>>({});
  const [enviando, setEnviando] = useState(false);

  const responder = useCallback(
    async (item: string, corpo: Record<string, unknown>, ultima?: unknown): Promise<ResultadoResposta | null> => {
      if (enviando) return null;

      setEnviando(true);

      try {
        const r = await responderAtividade(aula.id, atividade.ordem, { item, ...corpo });

        setEstados((atual) => ({
          ...atual,
          [item]: {
            resolvido: r.resolvido,
            correta: r.correta,
            tentativas: r.tentativas,
            dica: r.dica,
            respostaCorreta: r.resposta_correta,
            ultima: ultima ?? corpo,
          },
        }));

        atualizar({ estrelas: r.xp_total });

        if (r.correta) {
          celebrar(reduzido);

          if (r.conquistas.length > 0) mostrarConquistas(r.conquistas);

          void narrar([{ texto: r.mensagem }, ...falasDeConquistas(r.conquistas)]);
        } else {
          sons.dica();

          const falaResposta = r.resposta_correta != null ? descreverResposta?.(r.resposta_correta) : null;

          void narrar([{ texto: r.mensagem }, { texto: falaResposta ?? r.dica ?? "" }].filter((t) => t.texto));
        }

        return r;
      } catch (erro) {
        if (tratarSessao(erro)) return null;

        sons.dica();
        void narrar(FALA_FALHA_REDE);

        return null;
      } finally {
        setEnviando(false);
      }
    },
    [aula.id, atividade.ordem, atualizar, descreverResposta, enviando, mostrarConquistas, reduzido, tratarSessao],
  );

  const estadoDe = useCallback((item: string): EstadoItem | undefined => estados[item], [estados]);
  const resolvido = useCallback((item: string) => estados[item]?.resolvido ?? false, [estados]);
  const todosResolvidos = useCallback((itens: string[]) => itens.every((i) => estados[i]?.resolvido), [estados]);

  return { responder, estadoDe, resolvido, todosResolvidos, enviando };
}
