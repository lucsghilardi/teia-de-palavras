"use client";

import { createElement, type KeyboardEvent } from "react";
import { Check } from "lucide-react";

import { RemoteImage } from "@/components/painel/remote-image";
import { iconePorNome } from "@/lib/icones";
import { cn } from "@/lib/utils";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

type OpcaoVisualIconeProps = {
  opcao: OpcaoVisual | null | undefined;
  className?: string;
  /** Tamanho da imagem/emoji: classes Tailwind (ex.: "size-10 text-3xl"). */
  sizeClassName?: string;
  /** Quando o rótulo já está visível ao lado, o ícone é só decorativo. */
  decorative?: boolean;
};

/** Mostra a imagem da opção (se houver), senão o ícone na cor da opção (emoji como reserva). */
export function OpcaoVisualIcone({
  opcao,
  className,
  sizeClassName = "size-10 text-3xl",
  decorative = false,
}: OpcaoVisualIconeProps) {
  if (!opcao) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded-xl bg-muted text-muted-foreground",
          sizeClassName,
          className,
        )}
      >
        ?
      </span>
    );
  }

  if (opcao.imagem_url) {
    return (
      <RemoteImage
        src={opcao.imagem_url}
        alt={decorative ? "" : opcao.rotulo}
        aria-hidden={decorative ? true : undefined}
        className={cn("shrink-0 object-contain", sizeClassName, className)}
      />
    );
  }

  const temIcone = Boolean(opcao.icone);

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : opcao.rotulo}
      aria-hidden={decorative ? true : undefined}
      style={temIcone ? { backgroundColor: opcao.cor ?? undefined } : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center leading-none select-none",
        temIcone && "rounded-full text-slate-950",
        sizeClassName,
        className,
      )}
    >
      {temIcone ? createElement(iconePorNome(opcao.icone), { className: "size-[60%]", strokeWidth: 2.25 }) : opcao.emoji}
    </span>
  );
}

type OpcaoVisualGridProps = {
  opcoes: OpcaoVisual[];
  value: string | null;
  onChange: (chave: string) => void;
  /** Nome acessível do grupo (ex.: "Avatar da criança"). */
  label: string;
  /** `figura`: grade 3x3 (figura secreta); `avatar`: grade larga. */
  layout?: "avatar" | "figura";
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
};

/**
 * Grade de peças grandes selecionáveis (radiogroup). Setas movem a seleção,
 * como num grupo de rádios nativo.
 */
export function OpcaoVisualGrid({
  opcoes,
  value,
  onChange,
  label,
  layout = "avatar",
  disabled = false,
  invalid = false,
  id,
}: OpcaoVisualGridProps) {
  const selectedIndex = opcoes.findIndex((opcao) => opcao.chave === value);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const colunas = layout === "figura" ? 3 : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || opcoes.length === 0) {
      return;
    }

    const total = opcoes.length;
    const atual = selectedIndex >= 0 ? selectedIndex : 0;
    const vertical = colunas || 1;
    const passos: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: vertical,
      ArrowUp: -vertical,
    };
    const passo = passos[event.key];

    if (passo === undefined) {
      return;
    }

    event.preventDefault();
    const proximo = (((atual + passo) % total) + total) % total;
    onChange(opcoes[proximo].chave);

    const botoes = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    );
    botoes[proximo]?.focus();
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      className={cn(
        "grid gap-2",
        layout === "figura"
          ? "w-full max-w-sm grid-cols-3"
          : "grid-cols-4 sm:grid-cols-5 md:grid-cols-6",
      )}
    >
      {opcoes.map((opcao, index) => {
        const selected = opcao.chave === value;

        return (
          <button
            key={opcao.chave}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opcao.rotulo}
            title={opcao.rotulo}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opcao.chave)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card p-2 transition-all outline-none",
              "hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              layout === "figura" ? "aspect-square min-h-20" : "min-h-20",
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border",
            )}
          >
            <OpcaoVisualIcone
              opcao={opcao}
              decorative
              sizeClassName={
                layout === "figura" ? "size-14 text-5xl" : "size-11 text-4xl"
              }
            />
            <span className="line-clamp-1 text-[11px] font-semibold text-muted-foreground">
              {opcao.rotulo}
            </span>
            {selected ? (
              <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
