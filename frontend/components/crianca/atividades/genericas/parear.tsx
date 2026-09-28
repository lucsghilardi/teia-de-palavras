"use client";

import { useMemo, useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { Enunciado } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { Icone } from "@/components/crianca/ui/icone";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeParear, ItemParear } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "toque num item da esquerda e depois no par dele.";

function Item({ item, className, ...resto }: { item: ItemParear; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={item.texto}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl bg-[var(--c-superficie)] px-4 py-2 text-left text-xl font-extrabold shadow-[0_5px_0_var(--c-borda)] touch-manipulation",
        "transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
        className,
      )}
      {...resto}
    >
      {item.icone ? <Icone nome={item.icone} aria-hidden className="size-8 shrink-0 text-[var(--c-teia)]" /> : null}
      <span>{item.texto}</span>
    </button>
  );
}

/**
 * PAREAR: duas colunas; a criança toca num item da esquerda e no par dele à
 * direita. Par certo fica ligado; erro dá dica; 2º erro do mesmo item acende
 * o par certo. Continua quando todos os pares estão resolvidos.
 *
 * 1º ano: tocar num item fala o nome dele. Sem nada escolhido à esquerda,
 * tocar à direita só faz ouvir (a criança explora antes de ligar).
 */
export function Parear({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeParear>) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const { responder, estadoDe, todosResolvidos, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { texto?: string } | null;

      return r?.texto ? `o par certo é ${r.texto}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };
  const falas = atividade.pergunta ? [{ texto: atividade.pergunta }, instrucao] : [instrucao];

  useNarracaoDeChegada("parear", falas, instrucao, definirInstrucao);

  const idsEsquerda = useMemo(() => atividade.esquerda.map((i) => i.id), [atividade.esquerda]);
  const ligados = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const id of idsEsquerda) {
      const e = estadoDe(id);

      if (!e?.resolvido) continue;

      const b = e.correta ? (e.ultima as { b?: string } | undefined)?.b : (e.respostaCorreta as { b?: string } | null)?.b;

      if (b) mapa.set(id, b);
    }

    return mapa;
  }, [idsEsquerda, estadoDe]);
  const direitaLigada = new Set(ligados.values());
  const tudoResolvido = todosResolvidos(idsEsquerda);
  const dicaAtual = selecionado ? estadoDe(selecionado)?.dica : null;

  const ouvir = (lado: ItemParear[], id: string) => {
    const item = lado.find((i) => i.id === id);

    // narrar (e não falar): cancela a narração de chegada, que não volta por cima.
    if (item) void narrar({ texto: item.texto });
  };

  const tocarEsquerda = (id: string) => {
    sons.toque();
    setSelecionado((atual) => (atual === id ? null : id));
    if (selecionado !== id) ouvir(atividade.esquerda, id);
  };

  const tocarDireita = async (idB: string) => {
    if (!selecionado) {
      sons.toque();
      ouvir(atividade.direita, idB);

      return;
    }

    sons.toque();
    const r = await responder(selecionado, { b: idB }, { b: idB });

    if (r?.resolvido) setSelecionado(null);
  };

  return (
    <section aria-label="Ligar os pares" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center gap-4">
        {atividade.pergunta ? <Enunciado texto={atividade.pergunta} /> : null}

        <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-6">
          <ul aria-label="Esquerda" className="flex flex-col gap-2 sm:gap-3">
            {atividade.esquerda.map((item) => {
              const ligado = ligados.has(item.id);

              return (
                <li key={item.id}>
                  <Item
                    item={item}
                    disabled={ligado || enviando}
                    aria-pressed={selecionado === item.id}
                    onClick={() => tocarEsquerda(item.id)}
                    className={cn(
                      selecionado === item.id && "ring-4 ring-[var(--c-teia)] bg-[var(--c-teia)]/10",
                      ligado && "opacity-60 ring-4 ring-[var(--c-grama)]",
                    )}
                  />
                </li>
              );
            })}
          </ul>
          <ul aria-label="Direita" className="flex flex-col gap-2 sm:gap-3">
            {atividade.direita.map((item) => {
              const ligado = direitaLigada.has(item.id);

              return (
                <li key={item.id}>
                  <Item
                    item={item}
                    disabled={ligado || enviando}
                    onClick={() => void tocarDireita(item.id)}
                    className={cn(ligado && "opacity-60 ring-4 ring-[var(--c-grama)]", !selecionado && !ligado && "opacity-70")}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {dicaAtual ? (
          <p role="status" className="max-w-2xl text-center text-xl font-bold text-[var(--c-tinta)]/80">
            {dicaAtual}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-[88px] shrink-0 justify-end">
        {tudoResolvido ? <BotaoContinuar destaque onClick={aoConcluir} className="animate-crianca-entrar" /> : null}
      </div>
    </section>
  );
}
