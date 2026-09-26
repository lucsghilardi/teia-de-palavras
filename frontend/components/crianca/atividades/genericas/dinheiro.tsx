"use client";

import { Banknote, Check, Coins } from "lucide-react";
import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { Enunciado, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { alternarMoeda, falarReais, formatarReais, somaEscolhida } from "@/lib/atividades/dinheiro";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeDinheiro } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "toque nas moedas e notas até juntar o preço. depois toque em pagar.";

/**
 * DINHEIRO (EF02MA20): o preço e um punhado de moedas e notas. A criança
 * escolhe algumas (o total aparece na hora) e paga. Qualquer combinação
 * certa vale; erro diz quanto falta ou sobra; 2º erro mostra uma combinação.
 */
export function Dinheiro({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeDinheiro>) {
  const [indice, setIndice] = useState(0);
  const [escolhidas, setEscolhidas] = useState<Record<string, string[]>>({});
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { valores?: number[]; preco?: number } | null;

      return r?.valores ? `dá para pagar ${falarReais(r.preco ?? 0)} com ${r.valores.map(falarReais).join(" e ")}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };

  useNarracaoDeChegada(
    `dinheiro-${item?.id ?? indice}`,
    item ? [{ texto: `custa ${falarReais(item.preco)}.` }, instrucao] : [instrucao],
    instrucao,
    definirInstrucao,
  );

  if (!item) {
    return (
      <section aria-label="Pagar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const selecao = escolhidas[item.id] ?? [];
  const soma = somaEscolhida(item.moedas, selecao);
  const certas = (estado?.respostaCorreta as { escolhidas?: string[] } | null)?.escolhidas ?? null;
  const mostradas = resolvido && certas ? certas : selecao;

  const alternar = (id: string, valor: number) => {
    sons.toque();
    void narrar(falarReais(valor));
    setEscolhidas((atual) => ({ ...atual, [item.id]: alternarMoeda(atual[item.id] ?? [], id) }));
  };

  const pagar = () => {
    if (selecao.length === 0) {
      sons.dica();
      void narrar("toque em alguma moeda primeiro.");

      return;
    }

    void responder(item.id, { escolhidas: selecao }, { escolhidas: selecao });
  };

  return (
    <section aria-label="Pagar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5">
        <Enunciado texto={`custa ${formatarReais(item.preco)}`} icone="store" />

        <ul aria-label="Moedas e notas" className="flex flex-wrap justify-center gap-3">
          {item.moedas.map((moeda) => {
            const marcada = mostradas.includes(moeda.id);
            const nota = moeda.valor >= 2;

            return (
              <li key={moeda.id}>
                <BotaoGrande
                  rotulo={`${nota ? "nota" : "moeda"} de ${falarReais(moeda.valor)}${marcada ? ", escolhida" : ""}`}
                  cor={nota ? "neutra" : "alerta"}
                  redondo={!nota}
                  tamanho={nota ? 72 : 80}
                  disabled={resolvido || enviando}
                  aria-pressed={marcada}
                  data-moeda={moeda.valor}
                  className={cn(
                    "flex-col gap-0 px-4 text-2xl tabular-nums",
                    nota && "min-w-28",
                    marcada && "ring-4 ring-[var(--c-sucesso)] ring-offset-2 ring-offset-[var(--c-fundo)]",
                    resolvido && !marcada && "opacity-40",
                  )}
                  onClick={() => alternar(moeda.id, moeda.valor)}
                >
                  {nota ? <Banknote className="size-8" aria-hidden /> : <Coins className="size-7" aria-hidden />}
                  <span aria-hidden className="leading-none">{formatarReais(moeda.valor)}</span>
                </BotaoGrande>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div
            role="status"
            aria-label={`você juntou ${falarReais(soma)}`}
            className={cn(
              "flex min-h-16 items-center gap-2 rounded-full bg-[var(--c-superficie)] px-6 text-3xl font-black tabular-nums shadow-[0_5px_0_var(--c-borda)]",
              estado?.correta && "ring-4 ring-[var(--c-sucesso)]",
            )}
          >
            <Coins className="size-8 text-[var(--c-alerta)]" aria-hidden />
            <span aria-hidden>{formatarReais(soma)}</span>
          </div>

          <BotaoGrande
            rotulo="Pagar"
            cor="sucesso"
            tamanho={88}
            disabled={resolvido || enviando}
            destaque={soma === item.preco && !resolvido}
            aria-busy={enviando || undefined}
            onClick={pagar}
          >
            <Check className="size-11" strokeWidth={3.5} aria-hidden />
          </BotaoGrande>
        </div>

        {estado && !estado.correta && estado.dica ? (
          <p role="status" className="max-w-2xl text-center text-xl font-bold text-[var(--c-tinta)]/80">
            {estado.dica}
          </p>
        ) : null}
      </div>

      <RodapeItens
        total={atividade.itens.length}
        atual={indice}
        resolvido={resolvido}
        aoProximo={() => setIndice((i) => Math.min(atividade.itens.length - 1, i + 1))}
        aoConcluir={aoConcluir}
      />
    </section>
  );
}
