"use client";

import { forwardRef } from "react";

import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";

type Cor = "sol" | "ceu" | "grama" | "teia" | "branco";

const CORES: Record<Cor, string> = {
  sol: "bg-[var(--c-sol)] text-[var(--c-tinta)] shadow-[0_6px_0_var(--c-sol-sombra)]",
  ceu: "bg-[var(--c-ceu)] text-white shadow-[0_6px_0_var(--c-ceu-sombra)]",
  grama: "bg-[var(--c-grama)] text-white shadow-[0_6px_0_var(--c-grama-sombra)]",
  teia: "bg-[var(--c-teia)] text-white shadow-[0_6px_0_var(--c-teia-sombra)]",
  branco: "bg-white text-[var(--c-tinta)] shadow-[0_6px_0_var(--c-borda)]",
};

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  /** Nome acessível (leitor de tela e testes). Obrigatório: o botão costuma ter só ícone. */
  rotulo: string;
  /** Se definido, é falado em voz alta ao tocar (para quem ainda não lê). */
  falaAoTocar?: string;
  cor?: Cor;
  /** Tamanho mínimo em px (nunca menos que 64). */
  tamanho?: number;
  /** Chama atenção (pulsa) quando é o próximo passo esperado. */
  destaque?: boolean;
  redondo?: boolean;
};

/**
 * Botão do app da criança: grande (≥ 64 px), com cor viva, "afunda" ao tocar,
 * faz um som de toque e pode falar o próprio nome.
 */
export const BotaoGrande = forwardRef<HTMLButtonElement, Props>(function BotaoGrande(
  { rotulo, falaAoTocar, cor = "sol", tamanho = 80, destaque = false, redondo = true, className, onClick, children, style, ...resto },
  ref,
) {
  const lado = Math.max(64, tamanho);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={(evento) => {
        sons.toque();

        if (falaAoTocar) {
          void falar(falaAoTocar);
        }

        onClick?.(evento);
      }}
      style={{ minWidth: lado, minHeight: lado, ...style }}
      className={cn(
        "inline-flex select-none items-center justify-center gap-3 px-5 text-2xl font-extrabold",
        "transition-transform duration-100 active:translate-y-1 active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        redondo ? "rounded-full" : "rounded-3xl",
        CORES[cor],
        destaque && "animate-crianca-pulso",
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
});
