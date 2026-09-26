"use client";

import { Play } from "lucide-react";

import { exibir } from "@/lib/exibir";
import { cn } from "@/lib/utils";
import type { Missao, StatusMissao } from "@/types/CriancaApp";

export const ROTULO_STATUS: Record<StatusMissao, string> = {
  disponivel: "disponível",
  em_andamento: "em andamento",
  concluida: "concluída",
  bloqueada: "bloqueada",
};

/** Nome acessível do nó: "Missão TEIA, disponível". */
export function rotuloMissao(missao: Missao): string {
  return `Missão ${missao.rotulo.toLocaleUpperCase("pt-BR")}, ${ROTULO_STATUS[missao.status]}`;
}

const CIRCULO: Record<StatusMissao, string> = {
  bloqueada: "bg-[#E6E1DA] shadow-[0_6px_0_#C9C1B6]",
  disponivel: "bg-[var(--c-sol)] shadow-[0_8px_0_var(--c-sol-sombra)]",
  em_andamento: "bg-[var(--c-ceu)] shadow-[0_8px_0_var(--c-ceu-sombra)]",
  concluida: "bg-[var(--c-grama)] shadow-[0_8px_0_var(--c-grama-sombra)]",
};

function IconeStatus({ status, className }: { status: StatusMissao; className?: string }) {
  if (status === "bloqueada") return <span className={className}>🔒</span>;
  if (status === "concluida") return <span className={className}>⭐</span>;

  return <Play className={cn("fill-current", className)} strokeWidth={2.5} />;
}

/** Anel de progresso (etapa_atual / N+1) em volta de uma missão em andamento. */
function AnelProgresso({ etapa, total }: { etapa: number; total: number }) {
  const raio = 46;
  const volta = 2 * Math.PI * raio;
  const fracao = Math.min(1, Math.max(0, etapa / Math.max(1, total)));

  return (
    <svg viewBox="0 0 100 100" aria-hidden className="pointer-events-none absolute -inset-2.5 size-[calc(100%+1.25rem)] -rotate-90">
      <circle cx="50" cy="50" r={raio} fill="none" stroke="white" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={raio}
        fill="none"
        stroke="var(--c-grama)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${fracao * volta} ${volta}`}
      />
    </svg>
  );
}

/** Um nó da trilha de missões: círculo grande + a palavra geradora embaixo. */
export function NoMissao({
  missao,
  minusculas,
  onTocar,
  id,
}: {
  missao: Missao;
  minusculas: boolean;
  onTocar: (missao: Missao) => void;
  id?: string;
}) {
  const { status } = missao;
  const trancada = status === "bloqueada";
  const temImagem = Boolean(missao.palavra_imagem_url);

  return (
    <button
      id={id}
      type="button"
      aria-label={rotuloMissao(missao)}
      onClick={() => onTocar(missao)}
      className="group flex select-none flex-col items-center gap-0 rounded-[2rem] p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] touch-manipulation"
    >
      <span
        className={cn(
          "relative flex size-28 items-center justify-center rounded-full border-4 border-white transition-transform duration-100 group-active:translate-y-1 sm:size-32",
          CIRCULO[status],
          status === "disponivel" && "animate-crianca-pulso",
        )}
      >
        {status === "em_andamento" && missao.etapa_atual ? (
          <AnelProgresso etapa={missao.etapa_atual} total={missao.total_atividades + 1} />
        ) : null}

        {temImagem ? (
          // eslint-disable-next-line @next/next/no-img-element -- host da mídia muda por ambiente
          <img
            src={missao.palavra_imagem_url ?? undefined}
            alt=""
            aria-hidden
            draggable={false}
            loading="lazy"
            decoding="async"
            className={cn("size-full rounded-full bg-white object-cover", trancada && "opacity-50 grayscale")}
          />
        ) : (
          <IconeStatus
            status={status}
            className={cn(
              "text-5xl leading-none sm:text-6xl",
              status === "disponivel" ? "size-12 text-[var(--c-tinta)] sm:size-14" : "size-12 text-white sm:size-14",
              trancada && "opacity-70",
            )}
          />
        )}

        {temImagem ? (
          <span
            aria-hidden
            className={cn(
              "absolute -top-1 -right-1 flex size-11 items-center justify-center rounded-full border-4 border-white text-xl leading-none",
              trancada ? "bg-[#E6E1DA]" : status === "concluida" ? "bg-[var(--c-sol)]" : "bg-[var(--c-grama)] text-white",
            )}
          >
            <IconeStatus status={status} className={status === "disponivel" || status === "em_andamento" ? "size-5" : undefined} />
          </span>
        ) : null}
      </span>

      <span
        aria-hidden
        className={cn(
          "relative -mt-3 max-w-40 truncate rounded-full border-4 border-white px-4 py-1 text-xl font-black tracking-wide shadow-[0_4px_0_var(--c-borda)] sm:text-2xl",
          trancada ? "bg-[#F1EDE7] text-[#9C9388]" : "bg-white text-[var(--c-tinta)]",
        )}
      >
        {exibir(missao.rotulo, minusculas)}
      </span>
    </button>
  );
}
