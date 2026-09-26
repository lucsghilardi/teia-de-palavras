"use client";

import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { classeDaOpcao, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { dezenasEUnidades, fileirasDeDez } from "@/lib/atividades/grupos";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeContar, ItemContar } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "conte e toque no número certo.";

/** Os objetos em fileiras de 10; tocar numa fileira fala quantos ela tem. */
export function Objetos({ item, className }: { item: ItemContar; className?: string }) {
  const fileiras = fileirasDeDez(item.quantidade);
  // Quantos objetos vieram antes de cada fileira (para falar "até aqui, N").
  const inicios = fileiras.map((_, f) => fileiras.slice(0, f).reduce((soma, x) => soma + x, 0));

  return (
    <div role="group" aria-label={`${item.quantidade} objetos para contar`} className={cn("flex flex-col items-center gap-2", className)}>
      {fileiras.map((n, f) => {
        const inicio = inicios[f];

        return (
          <button
            key={f}
            type="button"
            aria-label={`fileira ${f + 1}: ${n} objetos`}
            onClick={() => {
              sons.toque();
              void narrar(n === 10 ? `uma fileira de 10. até aqui, ${inicio + n}.` : `${n} ${n === 1 ? "objeto" : "objetos"}. total até aqui, ${inicio + n}.`);
            }}
            className="flex min-h-16 flex-wrap items-center justify-center gap-1 rounded-2xl bg-[var(--c-superficie)]/80 px-2 py-1 shadow-[0_4px_0_var(--c-borda)] touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
          >
            {Array.from({ length: n }, (_, i) => (
              <Icone
                key={i}
                nome={item.icone}
                aria-hidden
                data-objeto=""
                className={cn("size-8 sm:size-10", i === 4 ? "mr-2" : "", "text-[var(--c-teia)]")}
                strokeWidth={2}
              />
            ))}
          </button>
        );
      })}
    </div>
  );
}

/**
 * CONTAR: objetos em fileiras de 10 (dezenas) e opções de número. Erro dá a
 * dica de contar de 10 em 10; 2º erro mostra o número certo.
 */
export function Contar({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeContar>) {
  const [indice, setIndice] = useState(0);
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { valor?: number } | null;

      return typeof r?.valor === "number" ? `são ${r.valor}: ${dezenasEUnidades(r.valor)}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };

  useNarracaoDeChegada(`contar-${item?.id ?? indice}`, [instrucao], instrucao, definirInstrucao);

  if (!item) {
    return (
      <section aria-label="Contar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const certo = (estado?.respostaCorreta as { valor?: number } | null)?.valor ?? (estado?.correta ? (estado.ultima as { valor?: number })?.valor : null);
  const ultimo = (estado?.ultima as { valor?: number } | undefined)?.valor;

  const aparencia = (valor: number) => {
    if (!estado) return "neutra" as const;
    if (valor === certo) return "certa" as const;
    if (valor === ultimo && !estado.correta) return "nao" as const;

    return resolvido ? ("apagada" as const) : ("neutra" as const);
  };

  return (
    <section aria-label="Contar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5 landscape:flex-row landscape:gap-8">
        <Objetos item={item} />

        <ul aria-label="Números" className="flex flex-wrap justify-center gap-3">
          {item.opcoes.map((valor) => (
            <li key={valor}>
              <BotaoGrande
                rotulo={String(valor)}
                cor="neutra"
                tamanho={88}
                disabled={resolvido || enviando}
                data-opcao={valor}
                className={cn("px-6 text-4xl tabular-nums", classeDaOpcao(aparencia(valor)))}
                onClick={() => void responder(item.id, { valor }, { valor })}
              >
                {valor}
              </BotaoGrande>
            </li>
          ))}
        </ul>
      </div>

      {estado && !estado.correta && estado.dica ? (
        <p role="status" className="text-center text-xl font-bold text-[var(--c-tinta)]/80">
          {estado.dica}
        </p>
      ) : null}

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
