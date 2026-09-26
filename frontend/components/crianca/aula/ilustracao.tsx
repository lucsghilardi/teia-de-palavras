"use client";

import { useState } from "react";

import { Icone } from "@/components/crianca/ui/icone";
import { cn } from "@/lib/utils";

/**
 * Figura da aula (imagem do CMS) ou, sem imagem, um desenho do tema: ícone
 * grande sobre um céu noturno. Imagem quebrada também cai no desenho.
 */
export function Ilustracao({
  src,
  icone,
  alt = "",
  className,
}: {
  src: string | null | undefined;
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

  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        "flex h-full w-full select-none items-center justify-center overflow-hidden rounded-[2rem]",
        "bg-linear-to-br from-[#312e81] via-[var(--c-superficie-2)] to-[var(--c-superficie)] ring-2 ring-[var(--c-borda)]",
        className,
      )}
    >
      <Icone nome={icone} aria-hidden className="size-[clamp(4rem,18vmin,10rem)] text-[var(--c-primaria)] drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]" strokeWidth={1.5} />
    </div>
  );
}
