"use client";

import { Check, Eraser } from "lucide-react";
import { useMemo, useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { Enunciado } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { completa, devolver, escolher, restantes, type Sequencia } from "@/lib/atividades/sequencia";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeOrdenar, ItemOrdenar } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "toque nos itens na ordem certa e depois confirme.";

function Cartao({ item, numero, className, ...resto }: { item: ItemOrdenar; numero?: number; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={item.texto}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-2xl bg-[var(--c-superficie)] px-4 py-2 text-left text-xl font-extrabold shadow-[0_5px_0_var(--c-borda)] touch-manipulation",
        "transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] disabled:opacity-60",
        className,
      )}
      {...resto}
    >
      {numero !== undefined ? (
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-teia)] text-lg text-white">
          {numero}
        </span>
      ) : null}
      {item.icone ? <Icone nome={item.icone} aria-hidden className="size-8 shrink-0 text-[var(--c-teia)]" /> : null}
      <span>{item.texto}</span>
    </button>
  );
}

/**
 * ORDENAR / LINHA DO TEMPO: a criança toca nos itens na ordem que acha certa
 * (eles sobem para a sequência) e confirma. Erro → dica e a sequência volta;
 * 2º erro → a ordem certa aparece numerada e ela segue.
 */
export function Ordenar({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeOrdenar>) {
  const ids = useMemo(() => atividade.itens.map((i) => i.id), [atividade.itens]);
  const porId = useMemo(() => new Map(atividade.itens.map((i) => [i.id, i])), [atividade.itens]);
  const [sequencia, setSequencia] = useState<Sequencia>([]);
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { itens?: ItemOrdenar[] } | null;

      return r?.itens ? `a ordem certa é: ${r.itens.map((i) => i.texto).join(", ")}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };
  const falas = atividade.pergunta ? [{ texto: atividade.pergunta }, instrucao] : [instrucao];

  useNarracaoDeChegada("ordenar", falas, instrucao, definirInstrucao);

  const estado = estadoDe("unico");
  const resolvido = estado?.resolvido ?? false;
  const ordemCerta = (estado?.respostaCorreta as { ordem?: string[] } | null)?.ordem ?? null;
  const mostrada = ordemCerta ?? (estado?.correta ? [...sequencia] : null);

  const tocarNoMonte = (id: string) => {
    sons.toque();
    setSequencia((s) => escolher(s, id, ids));
  };

  const tocarNaSequencia = (id: string) => {
    sons.toque();
    setSequencia((s) => devolver(s, id));
  };

  const confirmar = async () => {
    const r = await responder("unico", { ordem: [...sequencia] }, { ordem: [...sequencia] });

    if (r && !r.correta && !r.resolvido) setSequencia([]);
  };

  return (
    <section aria-label="Ordenar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center gap-4">
        {atividade.pergunta ? <Enunciado texto={atividade.pergunta} /> : null}

        <ol
          aria-label="Minha ordem"
          className="flex w-full max-w-3xl min-h-24 flex-col gap-2 rounded-[2rem] border-4 border-dashed border-[var(--c-borda)] bg-[var(--c-superficie)]/70 p-3"
        >
          {(mostrada ?? sequencia).map((id, i) => {
            const item = porId.get(id);

            return item ? (
              <li key={id} className="animate-crianca-entrar">
                <Cartao
                  item={item}
                  numero={i + 1}
                  disabled={resolvido || enviando}
                  onClick={() => tocarNaSequencia(id)}
                  className={cn(mostrada && "ring-4 ring-[var(--c-grama)]")}
                />
              </li>
            ) : null;
          })}
        </ol>

        {!resolvido ? (
          <ul aria-label="Itens para ordenar" className="flex w-full max-w-3xl flex-wrap justify-center gap-2 sm:gap-3">
            {restantes(sequencia, ids).map((id) => {
              const item = porId.get(id);

              return item ? (
                <li key={id}>
                  <Cartao item={item} disabled={enviando} onClick={() => tocarNoMonte(id)} />
                </li>
              ) : null;
            })}
          </ul>
        ) : null}

        {estado && !estado.correta && estado.dica ? (
          <p role="status" className="max-w-2xl text-center text-xl font-bold text-[var(--c-tinta)]/80">
            {estado.dica}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-[96px] shrink-0 items-center justify-center gap-4">
        {!resolvido ? (
          <>
            <BotaoGrande rotulo="Apagar" cor="neutra" tamanho={80} disabled={sequencia.length === 0 || enviando} onClick={() => setSequencia([])}>
              <Eraser className="size-9" strokeWidth={2.5} aria-hidden />
            </BotaoGrande>
            <BotaoGrande
              rotulo="Confirmar"
              cor="sucesso"
              tamanho={96}
              disabled={!completa(sequencia, ids.length) || enviando}
              destaque={completa(sequencia, ids.length) && !enviando}
              aria-busy={enviando || undefined}
              onClick={() => void confirmar()}
            >
              <Check className="size-12" strokeWidth={3.5} aria-hidden />
            </BotaoGrande>
          </>
        ) : (
          <BotaoContinuar destaque onClick={aoConcluir} className="animate-crianca-entrar" />
        )}
      </div>
    </section>
  );
}
