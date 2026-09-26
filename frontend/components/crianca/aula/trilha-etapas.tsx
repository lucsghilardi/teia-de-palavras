"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { narrar } from "@/components/crianca/aula/narrador";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import { ETAPAS, type Etapa } from "@/types/CriancaApp";

export const ICONE_ETAPA: Record<Etapa, string> = {
  missao: "📖",
  conversa: "💬",
  palavra: "🕸️",
  palmas: "👏",
  ficha: "🧩",
  criacao: "🛠️",
  producao: "✏️",
  conquista: "🏆",
};

/** Nome falado ao tocar no ícone da etapa que já está na tela. */
export const NOME_FALADO_ETAPA: Record<Etapa, string> = {
  missao: "A história da missão",
  conversa: "Hora de conversar",
  palavra: "A palavra da missão",
  palmas: "Palmas",
  ficha: "Ficha de descoberta",
  criacao: "Criar palavras",
  producao: "Fazer uma frase",
  conquista: "Conquista",
};

/**
 * Trilha das 8 etapas. A etapa na tela fica em destaque; as já liberadas podem
 * ser tocadas para rever; as da frente ficam trancadas (desabilitadas).
 * Nomes acessíveis estáveis: "Etapa N de 8".
 */
export function TrilhaEtapas({
  etapaAtual,
  etapaVisivel,
  concluidas,
  aoIr,
  className,
}: {
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
  aoIr: (etapa: number) => void;
  className?: string;
}) {
  const refTrilha = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    refTrilha.current
      ?.querySelector<HTMLElement>(`[data-etapa="${etapaVisivel}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [etapaVisivel]);

  return (
    // Botões de 64 px (regra do escopo). No celular as 8 etapas não cabem
    // lado a lado: a trilha rola na horizontal (a página não) e centraliza a atual.
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
      {ETAPAS.map((etapa, i) => {
        const n = i + 1;
        const visivel = n === etapaVisivel;
        const liberada = n <= etapaAtual;
        const feita = concluidas.includes(n);

        return (
          <li key={etapa} className="flex shrink-0 snap-center justify-center">
            <button
              type="button"
              aria-label={`Etapa ${n} de ${ETAPAS.length}`}
              aria-current={visivel ? "step" : undefined}
              data-etapa={n}
              disabled={!liberada}
              onClick={() => {
                sons.toque();

                if (visivel) {
                  void narrar(NOME_FALADO_ETAPA[etapa]);
                } else {
                  aoIr(n);
                }
              }}
              className={cn(
                "relative flex size-16 items-center justify-center rounded-2xl text-2xl",
                "transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
                "touch-manipulation select-none",
                visivel && "z-10 scale-110 bg-white shadow-[0_4px_0_var(--c-teia-sombra)] ring-4 ring-[var(--c-teia)]",
                !visivel && liberada && "bg-white/80 shadow-[0_3px_0_var(--c-borda)] active:translate-y-0.5",
                !liberada && "cursor-not-allowed bg-black/5 opacity-45 grayscale",
              )}
            >
              <span aria-hidden className="leading-none">
                {ICONE_ETAPA[etapa]}
              </span>
              {feita && !visivel && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--c-grama)] text-white shadow"
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
