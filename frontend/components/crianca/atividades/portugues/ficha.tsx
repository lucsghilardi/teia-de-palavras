"use client";

import { ArrowRight, Puzzle } from "lucide-react";
import { useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { Peca } from "@/components/crianca/ui/peca";
import { exibirPalavra } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import type { AtividadeFicha } from "@/types/CriancaApp";

const INSTRUCAO = { texto: "Toque nas peças para ouvir." };

/**
 * FICHA DE DESCOBERTA: uma linha por sílaba da palavra geradora, com a
 * família dela (TEI → TA TE TI TO TU). Tocar numa peça fala a sílaba.
 * "Continuar" está sempre ali e pulsa depois de 3 toques.
 */
export function Ficha({ atividade, minusculas, aoConcluir, definirInstrucao }: PropsAtividade<AtividadeFicha>) {
  const [toques, setToques] = useState(0);
  const [ativa, setAtiva] = useState<string | null>(null);
  useNarracaoDeChegada("ficha", [INSTRUCAO], INSTRUCAO, definirInstrucao);

  const ouvir = (chave: string, texto: string, audioUrl: string | null) => {
    sons.toque();
    setAtiva(chave);
    setToques((t) => t + 1);
    void narrar({ texto, audio_url: audioUrl });
  };

  return (
    <section aria-label="Ficha de descoberta" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div className="flex flex-1 flex-col justify-center gap-3 sm:gap-4">
        {atividade.linhas.map((linha, l) => (
          <div
            key={`${linha.silaba}-${l}`}
            role="group"
            aria-label={`Família da sílaba ${linha.silaba}`}
            className="animate-crianca-entrar flex flex-wrap items-center gap-2 rounded-[2rem] bg-[var(--c-superficie)] p-3 shadow-[0_5px_0_var(--c-borda)] sm:gap-3 sm:p-4"
            style={{ animationDelay: `${l * 80}ms` }}
          >
            <button
              type="button"
              aria-label={`Família ${linha.silaba}`}
              onClick={() => ouvir(`h-${l}`, linha.silaba, null)}
              className="flex min-h-20 min-w-20 items-center justify-center rounded-3xl bg-[var(--c-portugues)] px-4 text-4xl font-black text-[var(--c-fundo)] shadow-[0_5px_0_var(--c-teia-sombra)] transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] touch-manipulation"
            >
              {exibirPalavra(linha.silaba, minusculas)}
            </button>
            <ArrowRight aria-hidden className="size-8 text-white/30" />
            <div className="flex flex-1 flex-wrap gap-2 sm:gap-3">
              {linha.membros.map((m, i) => {
                const chave = `${l}-${i}`;

                return (
                  <Peca
                    key={chave}
                    texto={m.texto}
                    minusculas={minusculas}
                    tamanho="lg"
                    rotulo={`Sílaba ${m.texto}`}
                    ativa={ativa === chave}
                    onClick={() => ouvir(chave, m.texto, m.audio_url)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {atividade.linhas.length === 0 && (
          <Puzzle aria-hidden className="mx-auto size-24 text-[var(--c-borda)]" />
        )}
      </div>

      <div className="flex shrink-0 justify-end">
        <BotaoContinuar destaque={toques >= 3} onClick={aoConcluir} />
      </div>
    </section>
  );
}
