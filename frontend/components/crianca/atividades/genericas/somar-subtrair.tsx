"use client";

import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { classeDaOpcao, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeSomarSubtrair, ItemFato } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "quanto é? toque no número certo.";

function falarFato(item: ItemFato) {
  return `${item.a} ${item.operacao === "+" ? "mais" : "menos"} ${item.b}`;
}

/** Apoio concreto: `a` objetos e `b` objetos (na subtração, os `b` últimos ficam riscados). */
function Icones({ item }: { item: ItemFato }) {
  const soma = item.operacao === "+";

  return (
    <div role="img" aria-label={falarFato(item)} className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex max-w-xs flex-wrap justify-center gap-1 rounded-2xl bg-white/80 p-2 shadow-[0_4px_0_var(--c-borda)]">
        {Array.from({ length: item.a }, (_, i) => (
          <Icone
            key={i}
            nome="star"
            aria-hidden
            className={cn("size-7 text-[var(--c-teia)] sm:size-8", !soma && i >= item.a - item.b && "opacity-30 line-through")}
          />
        ))}
      </div>
      {soma ? (
        <>
          <span aria-hidden className="text-4xl font-black">
            +
          </span>
          <div className="flex max-w-xs flex-wrap justify-center gap-1 rounded-2xl bg-white/80 p-2 shadow-[0_4px_0_var(--c-borda)]">
            {Array.from({ length: item.b }, (_, i) => (
              <Icone key={i} nome="moon" aria-hidden className="size-7 text-[var(--c-sol-sombra)] sm:size-8" />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Apoio pictórico: reta numérica com o ponto de partida marcado. */
function Reta({ item }: { item: ItemFato }) {
  const maximo = Math.max(10, Math.ceil((item.operacao === "+" ? item.a + item.b : item.a) / 10) * 10);
  const numeros = Array.from({ length: maximo + 1 }, (_, i) => i);

  return (
    <div role="img" aria-label={`reta numérica de 0 a ${maximo}, começando no ${item.a}`} className="w-full max-w-3xl overflow-x-auto rounded-2xl bg-white/80 p-3 shadow-[0_4px_0_var(--c-borda)]">
      <ol className="flex min-w-max items-end gap-1">
        {numeros.map((n) => (
          <li
            key={n}
            className={cn(
              "flex w-8 flex-col items-center gap-1 text-base font-bold tabular-nums sm:w-9",
              n === item.a && "text-[var(--c-teia)]",
              n % 10 === 0 && "font-black",
            )}
          >
            <span aria-hidden className={cn("h-3 w-1 rounded-full bg-black/20", n % 5 === 0 && "h-5", n === item.a && "bg-[var(--c-teia)]")} />
            <span>{n}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * SOMAR E SUBTRAIR: um fato por vez, com apoio concreto (ícones), reta
 * numérica ou só símbolos. Opções de número; dica de contagem no erro.
 */
export function SomarSubtrair({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeSomarSubtrair>) {
  const [indice, setIndice] = useState(0);
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { valor?: number } | null;

      return typeof r?.valor === "number" && item ? `${falarFato(item)} é ${r.valor}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };

  useNarracaoDeChegada(`fato-${item?.id ?? indice}`, item ? [{ texto: `quanto é ${falarFato(item)}?` }] : [instrucao], instrucao, definirInstrucao);

  if (!item) {
    return (
      <section aria-label="Somar e subtrair" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
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
    <section aria-label="Somar e subtrair" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5">
        <button
          type="button"
          aria-label={`quanto é ${falarFato(item)}?`}
          data-fato={item.id}
          onClick={() => {
            sons.toque();
            void narrar(`quanto é ${falarFato(item)}?`);
          }}
          className="rounded-[2rem] bg-white px-8 py-4 text-[clamp(3rem,10vw,5rem)] font-black tabular-nums tracking-wider shadow-[0_6px_0_var(--c-borda)] touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
        >
          {item.a} {item.operacao === "+" ? "+" : "−"} {item.b} = {resolvido && certo !== null && certo !== undefined ? certo : "?"}
        </button>

        {atividade.apoio === "icones" ? <Icones item={item} /> : null}
        {atividade.apoio === "reta" ? <Reta item={item} /> : null}

        <ul aria-label="Números" className="flex flex-wrap justify-center gap-3">
          {item.opcoes.map((valor) => (
            <li key={valor}>
              <BotaoGrande
                rotulo={String(valor)}
                cor="branco"
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
