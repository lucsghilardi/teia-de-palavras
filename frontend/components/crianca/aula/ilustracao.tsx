"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Figura da aula (imagem do CMS) ou, sem imagem, um desenho amigável:
 * emoji grande sobre um degradê. Imagem quebrada também cai no desenho.
 */
export function Ilustracao({
  src,
  emoji,
  alt = "",
  className,
}: {
  src: string | null | undefined;
  emoji: string;
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
        className={cn("h-full w-full select-none rounded-[2rem] bg-white object-contain", className)}
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
        "bg-linear-to-br from-[#FFE29A] via-[#FFC7E0] to-[#B9A8FF]",
        className,
      )}
    >
      <span aria-hidden className="text-[clamp(3.5rem,16vmin,9rem)] leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.08)]">
        {emoji}
      </span>
    </div>
  );
}
