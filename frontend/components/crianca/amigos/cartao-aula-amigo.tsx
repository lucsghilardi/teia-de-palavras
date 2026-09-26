"use client";

import { Check, Ear } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { COPY } from "@/lib/copy";
import { rotuloAulaAmigo } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";
import type { EntregaMiniAula } from "@/types/CriancaApp";

/** Uma aula recebida: avatar e apelido de quem deu, o título e se ainda é nova. */
export function CartaoAulaAmigo({ entrega, minusculas, onTocar }: { entrega: EntregaMiniAula; minusculas: boolean; onTocar: (entrega: EntregaMiniAula) => void }) {
  const nova = entrega.status === "recebida";
  const avatar = entrega.mini_aula.autor.avatar;

  return (
    <BotaoGrande
      rotulo={rotuloAulaAmigo(entrega)}
      cor={nova ? "primaria" : "neutra"}
      redondo={false}
      tamanho={88}
      destaque={nova}
      className="w-full justify-start gap-4 px-4 py-3 text-left"
      onClick={() => onTocar(entrega)}
    >
      <span
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]"
        style={{ backgroundColor: avatar?.cor ?? "var(--c-superficie-2)" }}
      >
        <Icone nome={avatar?.icone ?? "user"} className="size-9" strokeWidth={2.25} />
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-xl font-extrabold sm:text-2xl">{exibir(entrega.mini_aula.titulo, minusculas)}</span>
        <span className="truncate text-base font-bold opacity-80">
          {exibir(`${entrega.mini_aula.autor.apelido} · ${nova ? COPY.amigos.nova : COPY.amigos.feita}`, minusculas)}
        </span>
      </span>
      <span aria-hidden className="shrink-0">
        {nova ? <Ear className="size-8" strokeWidth={2.5} /> : <Check className="size-8" strokeWidth={2.5} />}
      </span>
    </BotaoGrande>
  );
}
