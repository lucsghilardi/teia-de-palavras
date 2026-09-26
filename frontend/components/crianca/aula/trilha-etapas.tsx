"use client";

import { Check } from "lucide-react";
import { createElement, useEffect, useRef } from "react";

import { narrar } from "@/components/crianca/aula/narrador";
import { ICONE_TIPO, NOME_FALADO_TIPO } from "@/components/crianca/atividades/registro";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/types/CriancaApp";

/**
 * Trilha das etapas: as N atividades da missão e, no fim, a conquista. A etapa
 * na tela fica em destaque; as já liberadas podem ser tocadas para rever; as
 * da frente ficam trancadas (desabilitadas). Nomes acessíveis estáveis:
 * "Etapa n de N+1".
 */
export function TrilhaEtapas({
  atividades,
  etapaAtual,
  etapaVisivel,
  concluidas,
  aoIr,
  className,
}: {
  atividades: Atividade[];
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
  aoIr: (etapa: number) => void;
  className?: string;
}) {
  const refTrilha = useRef<HTMLOListElement | null>(null);
  const itens = [
    ...atividades.map((a) => ({ n: a.ordem, tipo: a.tipo as keyof typeof ICONE_TIPO })),
    { n: atividades.length + 1, tipo: "conquista" as const },
  ];

  useEffect(() => {
    refTrilha.current
      ?.querySelector<HTMLElement>(`[data-etapa="${etapaVisivel}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [etapaVisivel]);

  return (
    // Botões de 64 px (regra do escopo). No celular as etapas não cabem lado a
    // lado: a trilha rola na horizontal (a página não) e centraliza a atual.
    <ol
      ref={refTrilha}
      aria-label="Etapas da missão"
      className={cn(
        // Margens automáticas nas pontas: centraliza quando cabe e rola desde o
        // começo quando não cabe (justify-center cortaria o início).
        "flex w-full snap-x items-center gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li:first-child]:ms-auto [&>li:last-child]:me-auto",
        className,
      )}
    >
      {itens.map(({ n, tipo }) => {
        const visivel = n === etapaVisivel;
        const liberada = n <= etapaAtual;
        const feita = concluidas.includes(n);

        return (
          <li key={n} className="flex shrink-0 snap-center justify-center">
            <button
              type="button"
              aria-label={`Etapa ${n} de ${itens.length}`}
              aria-current={visivel ? "step" : undefined}
              data-etapa={n}
              disabled={!liberada}
              onClick={() => {
                sons.toque();

                if (visivel) {
                  void narrar(NOME_FALADO_TIPO[tipo]);
                } else {
                  aoIr(n);
                }
              }}
              className={cn(
                "relative flex size-16 items-center justify-center rounded-2xl",
                "transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
                "touch-manipulation select-none",
                visivel && "z-10 scale-110 bg-[var(--c-superficie-2)] text-[var(--c-primaria)] shadow-[0_4px_0_var(--c-primaria-sombra)] ring-4 ring-[var(--c-primaria)]",
                !visivel && liberada && "bg-[var(--c-superficie)] text-[var(--c-tinta)] shadow-[0_3px_0_var(--c-borda)] active:translate-y-0.5",
                !liberada && "cursor-not-allowed bg-white/5 text-[var(--c-tinta-suave)] opacity-45",
              )}
            >
              {createElement(ICONE_TIPO[tipo], { "aria-hidden": true, className: "size-8", strokeWidth: 2.25 })}
              {feita && !visivel && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--c-sucesso)] text-[var(--c-fundo)] shadow"
                >
                  <Check className="size-3.5" strokeWidth={4} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
