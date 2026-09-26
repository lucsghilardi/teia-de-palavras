"use client";

import { forwardRef } from "react";

import { exibir } from "@/lib/exibir";
import { cn } from "@/lib/utils";

/** Paleta das peças: a mesma sílaba sempre com a mesma cor no app inteiro. */
const CORES_PECA = [
  "bg-[#FFD166] text-[#5A3E00] shadow-[0_5px_0_#D9A93A]",
  "bg-[#7BDFF2] text-[#08415C] shadow-[0_5px_0_#4DB3C8]",
  "bg-[#B8F2A6] text-[#1F5220] shadow-[0_5px_0_#84C973]",
  "bg-[#F7AEF8] text-[#5B1760] shadow-[0_5px_0_#CC7FCD]",
  "bg-[#FFB4A2] text-[#6B2412] shadow-[0_5px_0_#D98470]",
  "bg-[#CDB4DB] text-[#3D2352] shadow-[0_5px_0_#A488B4]",
];

export function corDaPeca(texto: string): string {
  let soma = 0;

  for (const letra of texto.toUpperCase()) {
    soma = (soma * 31 + letra.charCodeAt(0)) >>> 0;
  }

  return CORES_PECA[soma % CORES_PECA.length];
}

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  texto: string;
  minusculas?: boolean;
  /** Rótulo acessível; padrão: "Sílaba TA". */
  rotulo?: string;
  tamanho?: "md" | "lg" | "xl";
  ativa?: boolean;
};

const TAMANHOS = {
  md: "min-h-16 min-w-16 px-3 text-3xl rounded-2xl",
  lg: "min-h-20 min-w-20 px-4 text-4xl rounded-3xl",
  xl: "min-h-28 min-w-28 px-5 text-6xl rounded-[2rem]",
};

/** Peça de sílaba (ficha de descoberta, bandeja da criação, palmas). */
export const Peca = forwardRef<HTMLButtonElement, Props>(function Peca(
  { texto, minusculas = false, rotulo, tamanho = "lg", ativa = false, className, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={rotulo ?? `Sílaba ${texto}`}
      className={cn(
        "inline-flex select-none items-center justify-center font-black tracking-wide",
        "transition-transform duration-100 active:translate-y-1 active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
        "disabled:opacity-40 [-webkit-touch-callout:none] touch-manipulation",
        TAMANHOS[tamanho],
        corDaPeca(texto),
        ativa && "ring-4 ring-[var(--c-teia)] ring-offset-2",
        className,
      )}
      {...resto}
    >
      {exibir(texto, minusculas)}
    </button>
  );
});
