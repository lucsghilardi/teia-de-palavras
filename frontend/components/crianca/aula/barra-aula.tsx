"use client";

import { useRouter } from "next/navigation";

import { cancelarNarracao, type Trecho } from "@/components/crianca/aula/narrador";
import { TrilhaEtapas } from "@/components/crianca/aula/trilha-etapas";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";

/**
 * Topo do player: voltar ao mapa (esquerda), trilha das 8 etapas (centro;
 * numa segunda linha em telas estreitas), estrelas e o alto-falante (direita).
 */
export function BarraAula({
  etapaAtual,
  etapaVisivel,
  concluidas,
  aoIr,
  instrucao,
  estrelas,
  mostrarVoltar = true,
}: {
  etapaAtual: number;
  etapaVisivel: number;
  concluidas: number[];
  aoIr: (etapa: number) => void;
  instrucao: Trecho;
  estrelas: number | null;
  /** Na etapa 8 o botão grande "Voltar ao mapa" fica no conteúdo. */
  mostrarVoltar?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-2 pt-3 sm:px-5 lg:flex-nowrap lg:gap-3">
      <div className="order-1 shrink-0">
        {mostrarVoltar ? (
          <BotaoGrande rotulo="Voltar ao mapa" cor="branco" tamanho={64} onClick={() => router.push("/app")}>
            <span aria-hidden className="text-3xl leading-none">
              🗺️
            </span>
          </BotaoGrande>
        ) : (
          <div aria-hidden className="size-16" />
        )}
      </div>

      <nav aria-label="Trilha da missão" className="order-3 w-full min-w-0 lg:order-2 lg:w-auto lg:flex-1">
        <TrilhaEtapas etapaAtual={etapaAtual} etapaVisivel={etapaVisivel} concluidas={concluidas} aoIr={aoIr} />
      </nav>

      <div className="order-2 ml-auto flex shrink-0 items-center gap-2 lg:order-3 lg:ml-0">
        {estrelas !== null && (
          <div
            role="img"
            aria-label={`${estrelas} estrelas`}
            className="flex h-12 items-center gap-1 rounded-full bg-white/80 px-3 text-xl font-black shadow-[0_3px_0_var(--c-borda)]"
          >
            <span aria-hidden>⭐</span>
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
