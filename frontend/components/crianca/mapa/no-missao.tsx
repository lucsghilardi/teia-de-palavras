"use client";

import { Lock, Play, Star } from "lucide-react";

import { exibirPalavra } from "@/lib/exibir";
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

/** Cor do círculo: a do planeta (var(--c-planeta), definida pela página) para a missão aberta. */
const CIRCULO: Record<StatusMissao, string> = {
  bloqueada: "bg-[var(--c-superficie-2)] shadow-[0_6px_0_var(--c-borda)]",
  disponivel: "bg-[var(--c-planeta)] shadow-[0_8px_0_var(--c-borda)]",
  em_andamento: "bg-[var(--c-primaria)] shadow-[0_8px_0_var(--c-primaria-sombra)]",
  concluida: "bg-[var(--c-sucesso)] shadow-[0_8px_0_var(--c-sucesso-sombra)]",
};

function IconeStatus({ status, className }: { status: StatusMissao; className?: string }) {
  if (status === "bloqueada") return <Lock className={className} strokeWidth={2.5} />;
  if (status === "concluida") return <Star className={cn("fill-current", className)} strokeWidth={2.5} />;

  return <Play className={cn("fill-current", className)} strokeWidth={2.5} />;
}

/** Anel de progresso (etapa_atual / N+1) em volta de uma missão em andamento. */
function AnelProgresso({ etapa, total }: { etapa: number; total: number }) {
  const raio = 46;
  const volta = 2 * Math.PI * raio;
  const fracao = Math.min(1, Math.max(0, etapa / Math.max(1, total)));

  return (
    <svg viewBox="0 0 100 100" aria-hidden className="pointer-events-none absolute -inset-2.5 size-[calc(100%+1.25rem)] -rotate-90">
      <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--c-borda)" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={raio}
        fill="none"
        stroke="var(--c-sucesso)"
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
          "relative flex size-28 items-center justify-center rounded-full border-4 border-[var(--c-fundo)] text-[var(--c-fundo)] transition-transform duration-100 group-active:translate-y-1 sm:size-32",
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
            className={cn("size-full rounded-full bg-[var(--c-superficie)] object-cover", trancada && "opacity-40 grayscale")}
          />
        ) : (
          <IconeStatus
            status={status}
            className={cn("size-12 sm:size-14", trancada ? "text-[var(--c-tinta-suave)]" : "text-[var(--c-fundo)]")}
          />
        )}

        {temImagem ? (
          <span
            aria-hidden
            className={cn(
              "absolute -top-1 -right-1 flex size-11 items-center justify-center rounded-full border-4 border-[var(--c-fundo)] text-[var(--c-fundo)]",
              trancada ? "bg-[var(--c-superficie-2)] text-[var(--c-tinta-suave)]" : status === "concluida" ? "bg-[var(--c-sucesso)]" : "bg-[var(--c-planeta)]",
            )}
          >
            <IconeStatus status={status} className="size-5" />
          </span>
        ) : null}
      </span>

      <span
        aria-hidden
        className={cn(
          "relative -mt-3 max-w-40 truncate rounded-full border-4 border-[var(--c-fundo)] px-4 py-1 text-xl font-black tracking-wide shadow-[0_4px_0_var(--c-borda)] sm:text-2xl",
          trancada ? "bg-[var(--c-superficie-2)] text-[var(--c-tinta-suave)]" : "bg-[var(--c-superficie)] text-[var(--c-tinta)]",
        )}
      >
        {exibirPalavra(missao.rotulo, minusculas)}
      </span>
    </button>
  );
}
