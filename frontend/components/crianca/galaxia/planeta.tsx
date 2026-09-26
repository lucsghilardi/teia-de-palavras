"use client";

import { Lock } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import { cn } from "@/lib/utils";
import type { Planeta as DadosPlaneta } from "@/types/CriancaApp";

const FALA_FECHADO = "Esse planeta ainda está fechado. Em breve!";

/** Um planeta da Galáxia: círculo na cor da disciplina, nome e progresso. */
export function Planeta({
  planeta,
  minusculas,
  onTocar,
}: {
  planeta: DadosPlaneta;
  minusculas: boolean;
  onTocar: (planeta: DadosPlaneta) => void;
}) {
  const aberto = planeta.publicadas > 0;
  const progresso = aberto ? `${planeta.concluidas} de ${planeta.publicadas}` : COPY.galaxia.emBreve;

  return (
    <BotaoGrande
      rotulo={`Planeta ${planeta.nome}`}
      falaAoTocar={aberto ? undefined : FALA_FECHADO}
      cor="neutra"
      redondo={false}
      tamanho={96}
      className={cn("w-full flex-col gap-2 px-3 py-4", !aberto && "opacity-60")}
      onClick={() => aberto && onTocar(planeta)}
    >
      <span
        aria-hidden
        className="relative flex size-20 items-center justify-center rounded-full text-[var(--c-fundo)] sm:size-24"
        style={{ backgroundColor: planeta.cor, boxShadow: `0 0 0 6px color-mix(in srgb, ${planeta.cor} 30%, transparent)` }}
      >
        <Icone nome={planeta.icone} className="size-10 sm:size-12" strokeWidth={2.25} />
        {!aberto ? (
          <Lock className="absolute -right-1 -bottom-1 size-7 rounded-full bg-[var(--c-superficie)] p-1 text-[var(--c-tinta)]" />
        ) : null}
      </span>
      <span aria-hidden className="text-xl font-extrabold leading-tight sm:text-2xl">{exibir(planeta.nome, minusculas)}</span>
      <span aria-hidden className="text-sm font-bold text-[var(--c-tinta-suave)]">{exibir(progresso, minusculas)}</span>
    </BotaoGrande>
  );
}
