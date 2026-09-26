"use client";

import { Users } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";

/** Base dos amigos: aulas de outras crianças (Fase 7). Por ora só anuncia. */
export function CartaoAmigos({ novas, minusculas }: { novas: number; minusculas: boolean }) {
  return (
    <BotaoGrande
      rotulo={COPY.galaxia.amigos}
      falaAoTocar={COPY.galaxia.amigosEmBreve}
      cor="neutra"
      redondo={false}
      tamanho={80}
      className="w-full justify-start gap-4 px-4 text-left opacity-70"
    >
      <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--c-superficie-2)]">
        <Users className="size-8" strokeWidth={2.25} />
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-xl font-extrabold sm:text-2xl">{exibir(COPY.galaxia.amigos, minusculas)}</span>
        <span className="truncate text-base font-bold text-[var(--c-tinta-suave)]">
          {exibir(novas > 0 ? `${novas} novas` : COPY.galaxia.emBreve, minusculas)}
        </span>
      </span>
    </BotaoGrande>
  );
}
