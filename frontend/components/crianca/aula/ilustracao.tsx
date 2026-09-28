"use client";

import { useState } from "react";

import { existeIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import { CenaIlustrada } from "@/components/crianca/ilustracoes/cena-ilustrada";
import { Icone } from "@/components/crianca/ui/icone";
import { cn } from "@/lib/utils";

const MOLDURA = "bg-linear-to-br from-[#312e81] via-[var(--c-superficie-2)] to-[var(--c-superficie)] ring-2 ring-[var(--c-borda)]";

/**
 * Figura da aula. Ordem: imagem enviada pelo painel, senão a cena desenhada
 * pelo app (`chave` do catálogo de ilustrações), senão um ícone grande sobre
 * um céu noturno. Imagem quebrada também cai na cena ou no ícone.
 */
export function Ilustracao({
  src,
  chave,
  icone,
  alt = "",
  className,
}: {
  src: string | null | undefined;
  /** Chave de uma cena do catálogo (components/crianca/ilustracoes/catalogo.ts). */
  chave?: string | null;
  /** Nome de ícone do lucide (lib/icones.ts) para a reserva. */
  icone: string;
  alt?: string;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);

  if (src && !falhou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- host da mídia muda por ambiente
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFalhou(true)}
        className={cn("h-full w-full select-none rounded-[2rem] bg-[var(--c-superficie)] object-contain", className)}
      />
    );
  }

  if (existeIlustracao(chave)) {
    return (
      <div
        aria-hidden={alt ? undefined : true}
        className={cn("h-full w-full select-none overflow-hidden rounded-[2rem]", MOLDURA, className)}
      >
        <CenaIlustrada chave={chave} />
      </div>
    );
  }

  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        "flex h-full w-full select-none items-center justify-center overflow-hidden rounded-[2rem]",
        MOLDURA,
        className,
      )}
    >
      <Icone nome={icone} aria-hidden className="size-[clamp(4rem,18vmin,10rem)] text-[var(--c-primaria)] drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]" strokeWidth={1.5} />
    </div>
  );
}
