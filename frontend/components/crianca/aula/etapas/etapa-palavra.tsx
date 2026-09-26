"use client";

import { motion } from "motion/react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { Ilustracao } from "@/components/crianca/aula/ilustracao";
import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import type { PropsEtapa } from "@/components/crianca/aula/tipos";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";

/**
 * Etapa 3 — PALAVRA GERADORA: a figura e a palavra ENORME. Tocar em qualquer
 * uma das duas fala a palavra.
 */
export function EtapaPalavra({ aula, minusculas, aoConcluir, definirInstrucao }: PropsEtapa) {
  const reduzido = useMovimentoReduzido();
  const palavra = { texto: aula.palavra_geradora, audio_url: aula.palavra_audio_url };
  const narrou = useNarracaoDeChegada("palavra", [{ texto: "Esta é a palavra da nossa missão:" }, palavra], palavra, definirInstrucao);

  const ouvir = () => {
    sons.toque();
    void narrar(palavra);
  };

  return (
    <section aria-label="A palavra da missão" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-4 landscape:flex-row landscape:gap-8">
        <motion.button
          type="button"
          aria-label={`Figura da palavra ${aula.palavra_geradora}`}
          onClick={ouvir}
          whileTap={reduzido ? undefined : { scale: 0.95 }}
          className="relative aspect-square w-[min(70vw,42vh)] max-w-sm shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] landscape:w-[min(40vw,50vh)] rounded-[2rem]"
        >
          <Ilustracao src={aula.palavra_imagem_url} emoji="🕸️" className="absolute inset-0 shadow-[0_8px_0_var(--c-borda)]" />
        </motion.button>

        <motion.button
          type="button"
          aria-label={`Palavra ${aula.palavra_geradora}`}
          onClick={ouvir}
          whileTap={reduzido ? undefined : { scale: 0.93 }}
          className="max-w-full touch-manipulation break-all rounded-[2rem] px-4 text-center font-black leading-none tracking-[0.08em] text-[var(--c-teia)] drop-shadow-[0_6px_0_var(--c-teia-sombra)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] text-[clamp(4rem,17vw,11rem)] landscape:text-[clamp(4rem,12vw,10rem)]"
        >
          {exibir(aula.palavra_geradora, minusculas)}
        </motion.button>
      </div>

      <div className="flex shrink-0 justify-end">
        <BotaoContinuar destaque={narrou} onClick={aoConcluir} />
      </div>
    </section>
  );
}
