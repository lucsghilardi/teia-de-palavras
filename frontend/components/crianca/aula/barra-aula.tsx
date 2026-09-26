"use client";

import { ArrowLeft, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { cancelarNarracao, type Trecho } from "@/components/crianca/aula/narrador";
import { TrilhaEtapas } from "@/components/crianca/aula/trilha-etapas";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { COPY } from "@/lib/copy";
import type { Atividade, Disciplina } from "@/types/CriancaApp";

/**
 * Topo do player: voltar ao planeta (esquerda), trilha das etapas (centro;
 * numa segunda linha em telas estreitas), pontos e o alto-falante (direita).
 */
export function BarraAula({
  disciplina,
  atividades,
  etapaAtual,
  etapaVisivel,
  concluidas,
  aoIr,
  instrucao,
  estrelas,
  mostrarVoltar = true,
}: {
  disciplina: Disciplina;
  atividades: Atividade[];
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
  aoIr: (etapa: number) => void;
  instrucao: Trecho;
  estrelas: number | null;
  /** Na conquista o botão grande "Voltar ao mapa" fica no conteúdo. */
  mostrarVoltar?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-2 pt-3 sm:px-5 lg:flex-nowrap lg:gap-3">
      <div className="order-1 shrink-0">
        {mostrarVoltar ? (
          <BotaoGrande rotulo={COPY.missao.voltar} cor="neutra" tamanho={64} onClick={() => router.push(`/app/planeta/${disciplina}`)}>
            <ArrowLeft className="size-9" aria-hidden />
          </BotaoGrande>
        ) : (
          <div aria-hidden className="size-16" />
        )}
      </div>

      <nav aria-label="Trilha da missão" className="order-3 w-full min-w-0 lg:order-2 lg:w-auto lg:flex-1">
        <TrilhaEtapas atividades={atividades} etapaAtual={etapaAtual} etapaVisivel={etapaVisivel} concluidas={concluidas} aoIr={aoIr} />
      </nav>

      <div className="order-2 ml-auto flex shrink-0 items-center gap-2 lg:order-3 lg:ml-0">
        {estrelas !== null && (
          <div
            role="img"
            aria-label={COPY.comum.pontos(estrelas)}
            className="flex h-12 items-center gap-1.5 rounded-full bg-[var(--c-superficie)] px-3 text-xl font-black shadow-[0_3px_0_var(--c-borda)]"
          >
            <Star aria-hidden className="size-6 fill-[var(--c-alerta)] text-[var(--c-alerta)]" />
            <span aria-hidden>{estrelas}</span>
          </div>
        )}
        {/* Tocar no alto-falante cancela sequências de fala em andamento. */}
        <div onClickCapture={cancelarNarracao}>
          <BotaoOuvir texto={instrucao.texto} audioUrl={instrucao.audio_url ?? null} />
        </div>
      </div>
    </header>
  );
}
