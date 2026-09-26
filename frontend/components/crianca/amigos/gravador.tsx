"use client";

import { Mic, MicOff, Play, RotateCcw, Send, Square } from "lucide-react";
import { useEffect } from "react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { type Gravacao, useGravador } from "@/hooks/use-gravador";
import { COPY } from "@/lib/copy";
import { relogio } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { cn } from "@/lib/utils";

type Props = {
  /** O desafio escolhido (o que a criança vai explicar). */
  titulo: string;
  fala: string;
  limiteSegundos: number;
  enviando: boolean;
  minusculas: boolean;
  aoEnviar: (gravacao: Gravacao) => void;
  definirInstrucao: (texto: string) => void;
};

/**
 * Gravar a voz em três toques: gravar → parar → enviar (com pré-escuta e
 * "gravar de novo"). O cronômetro para sozinho no limite.
 */
export function Gravador({ titulo, fala, limiteSegundos, enviando, minusculas, aoEnviar, definirInstrucao }: Props) {
  const { estado, segundos, gravacao, iniciar, parar, descartar } = useGravador(Math.min(30, limiteSegundos));

  useEffect(() => {
    definirInstrucao(estado === "sem_microfone" ? COPY.amigos.semMicrofone : `${fala} ${COPY.amigos.gravarInstrucao}`);
  }, [estado, fala, definirInstrucao]);

  useEffect(() => {
    if (estado === "sem_microfone") void falar(COPY.amigos.semMicrofone);
  }, [estado]);

  const gravando = estado === "gravando";

  return (
    <section aria-label="Gravador" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-6 text-center">
      <h2 className="max-w-2xl text-[clamp(1.5rem,4.5vw,2.5rem)] font-black leading-tight">{exibir(titulo, minusculas)}</h2>
      <p className="max-w-xl text-xl font-bold text-[var(--c-tinta-suave)]">{exibir(COPY.amigos.gravarInstrucao, minusculas)}</p>

      <div
        role="timer"
        aria-label={`${COPY.amigos.gravando}: ${relogio(segundos)}`}
        className={cn(
          "rounded-full px-6 py-2 text-4xl font-black tabular-nums ring-4",
          gravando ? "bg-[var(--c-superficie)] text-[var(--c-alerta)] ring-[var(--c-alerta)]" : "bg-[var(--c-superficie)] text-[var(--c-tinta-suave)] ring-[var(--c-borda)]",
        )}
      >
        <span aria-hidden>
          {relogio(segundos)} / {relogio(limiteSegundos)}
        </span>
      </div>

      {estado === "parado" || estado === "pedindo" ? (
        <BotaoGrande rotulo={COPY.amigos.gravar} cor="primaria" tamanho={128} destaque disabled={estado === "pedindo"} onClick={() => void iniciar()}>
          <Mic className="size-16" aria-hidden strokeWidth={2.25} />
        </BotaoGrande>
      ) : null}

      {gravando ? (
        <BotaoGrande rotulo={COPY.amigos.parar} cor="alerta" tamanho={128} destaque onClick={parar}>
          <Square className="size-14 fill-current" aria-hidden />
        </BotaoGrande>
      ) : null}

      {estado === "sem_microfone" ? (
        <>
          <MicOff className="size-20 text-[var(--c-borda)]" aria-hidden />
          <p className="max-w-md text-2xl font-bold">{exibir(COPY.amigos.semMicrofone, minusculas)}</p>
          <BotaoGrande rotulo={COPY.comum.tentarDeNovo} cor="primaria" tamanho={96} className="px-8" onClick={() => void iniciar()}>
            <RotateCcw className="size-12" aria-hidden />
          </BotaoGrande>
        </>
      ) : null}

      {estado === "pronto" && gravacao ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <BotaoGrande rotulo={COPY.amigos.ouvirGravacao} cor="primaria" tamanho={96} className="px-8" disabled={enviando} onClick={() => void falar(fala, gravacao.url)}>
            <Play className="size-12 fill-current" aria-hidden />
          </BotaoGrande>
          <BotaoGrande rotulo={COPY.amigos.gravarDeNovo} cor="neutra" tamanho={96} className="px-8" disabled={enviando} onClick={descartar}>
            <RotateCcw className="size-12" aria-hidden />
          </BotaoGrande>
          <BotaoGrande rotulo={COPY.amigos.enviar} cor="sucesso" tamanho={96} destaque className="px-8" disabled={enviando} onClick={() => aoEnviar(gravacao)}>
            <Send className="size-12" aria-hidden />
          </BotaoGrande>
        </div>
      ) : null}
    </section>
  );
}
