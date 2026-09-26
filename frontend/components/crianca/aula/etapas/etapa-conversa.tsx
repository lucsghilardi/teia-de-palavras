"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { Pontinhos } from "@/components/crianca/aula/etapas/pontinhos";
import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import type { PropsEtapa } from "@/components/crianca/aula/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { exibir } from "@/lib/exibir";

const CONVIDAR = "Converse com as pessoas perto de você!";

/**
 * Etapa 2 — CONVERSA: uma pergunta por vez, falada. Não há resposta certa:
 * a criança conversa com quem está perto. (Gravar a resposta: fase futura.)
 */
export function EtapaConversa({ aula, minusculas, aoConcluir, definirInstrucao }: PropsEtapa) {
  const perguntas = aula.perguntas;
  const [indice, setIndice] = useState(0);
  const atual = perguntas[indice] ?? null;
  const ultima = indice >= perguntas.length - 1;

  const pergunta = atual
    ? { texto: atual.texto, audio_url: atual.audio_url }
    : { texto: "Conte para quem está perto de você: do que você mais gostou na história?" };
  const fala = indice === 0 ? [{ texto: "Hora de conversar!" }, pergunta] : [pergunta];
  const narrou = useNarracaoDeChegada(`pergunta-${indice}`, fala, pergunta, definirInstrucao);

  return (
    <section aria-label="Hora de conversar" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={indice} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5 landscape:flex-row">
        <div className="relative flex w-full max-w-2xl flex-1 flex-col items-center justify-center rounded-[2.5rem] bg-white px-6 py-8 shadow-[0_8px_0_var(--c-borda)] landscape:self-stretch">
          <span aria-hidden className="text-[clamp(4rem,14vmin,8rem)] leading-none">
            💬
          </span>
          <p className="mt-4 text-center text-[clamp(1.25rem,3.2vw,2.1rem)] font-extrabold leading-snug">
            {exibir(pergunta.texto, minusculas)}
          </p>
        </div>

        <BotaoGrande
          rotulo="Conversar com quem está perto"
          cor="sol"
          tamanho={128}
          onClick={() => void narrar(CONVIDAR)}
          className="shrink-0"
        >
          <span aria-hidden className="text-6xl leading-none">
            👨‍👩‍👧
          </span>
        </BotaoGrande>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
        <div aria-hidden className="w-20" />
        <Pontinhos total={perguntas.length} atual={indice} />
        {ultima ? (
          <BotaoContinuar destaque={narrou} onClick={aoConcluir} />
        ) : (
          <BotaoGrande
            rotulo="Próxima pergunta"
            cor="ceu"
            tamanho={88}
            destaque={narrou}
            className="px-8"
            onClick={() => setIndice((i) => Math.min(perguntas.length - 1, i + 1))}
          >
            <ArrowRight className="size-11" strokeWidth={3} aria-hidden />
          </BotaoGrande>
        )}
      </div>
    </section>
  );
}
