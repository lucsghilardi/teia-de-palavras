"use client";

import { Repeat } from "lucide-react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { VisualOpcao } from "@/components/crianca/comum/visual-opcao";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import type { TurmaEntrada } from "@/types/CriancaApp";

export type CriancaEntrada = TurmaEntrada["criancas"][number];

const INSTRUCAO = "Quem é você? Toque no seu bichinho.";
const TURMA_VAZIA = "Ainda não tem crianças nesta turma. Vamos chamar um adulto?";

/** Passo 2 da entrada: a grade de bichinhos (avatares) da turma. */
export function QuemEVoce({
  turma,
  onEscolher,
  onTrocarTurma,
}: {
  turma: TurmaEntrada;
  onEscolher: (crianca: CriancaEntrada) => void;
  onTrocarTurma: () => void;
}) {
  const vazia = turma.criancas.length === 0;
  const instrucao = vazia ? TURMA_VAZIA : INSTRUCAO;

  useFalarAoChegar(instrucao);

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao}>
        <span aria-hidden className="text-5xl">
          🙋
        </span>
        <h1 className="sr-only">Quem é você?</h1>
      </BarraTopo>

      <div className="flex-1 px-4 pb-6 sm:px-6">
        {vazia ? (
          <div className="flex h-full min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
            <span aria-hidden className="text-8xl">
              🧑‍🏫
            </span>
            <p className="text-2xl font-extrabold">{exibir("Vamos chamar um adulto?")}</p>
          </div>
        ) : (
          <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            {turma.criancas.map((crianca, indice) => (
              <li key={crianca.id} className="animate-crianca-entrar" style={{ animationDelay: `${Math.min(indice, 12) * 40}ms` }}>
                <button
                  type="button"
                  aria-label={crianca.apelido}
                  onClick={() => {
                    sons.toque();
                    void falar(crianca.apelido);
                    onEscolher(crianca);
                  }}
                  className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl bg-white p-3 shadow-[0_6px_0_var(--c-borda)] transition-transform duration-100 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] touch-manipulation"
                >
                  <VisualOpcao opcao={crianca.avatar} className="size-24 text-7xl sm:size-28 sm:text-8xl" />
                  <span className="w-full truncate text-center text-xl font-black tracking-wide sm:text-2xl">
                    {exibir(crianca.apelido)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Para adultos: discreto, no rodapé. */}
      <footer className="flex flex-wrap items-center justify-center gap-x-3 px-4 pb-4 text-sm font-semibold text-[color-mix(in_srgb,var(--c-tinta)_55%,transparent)]">
        <span>Turma {turma.turma.nome}</span>
        <button
          type="button"
          aria-label="Trocar turma"
          onClick={onTrocarTurma}
          className="inline-flex min-h-16 items-center gap-1.5 rounded-full px-4 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
        >
          <Repeat className="size-4" aria-hidden />
          trocar turma
        </button>
      </footer>
    </main>
  );
}
