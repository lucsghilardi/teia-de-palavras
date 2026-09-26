"use client";

import { Lock, Medal } from "lucide-react";

import { narrar } from "@/components/crianca/aula/narrador";
import { Icone } from "@/components/crianca/ui/icone";
import { textoDasMedalhas } from "@/lib/crianca/nivel";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { Medalhas as DadosMedalhas } from "@/types/CriancaApp";

/**
 * Todas as medalhas da criança: as ganhas em cor, as por ganhar apagadas com
 * um cadeado. Tocar fala o título e a descrição. Nunca compara com ninguém.
 */
export function Medalhas({ dados, minusculas }: { dados: DadosMedalhas | null; minusculas: boolean }) {
  if (!dados) {
    return (
      <div role="status" aria-label="Carregando medalhas" className="flex min-h-40 items-center justify-center">
        <Medal className="size-16 animate-crianca-pulso text-[var(--c-borda)]" aria-hidden />
      </div>
    );
  }

  return (
    <section aria-label="Medalhas" className="w-full max-w-3xl">
      <h2 className="mb-3 text-center text-2xl font-black">{exibir(textoDasMedalhas(dados.desbloqueadas, dados.total), minusculas)}</h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dados.medalhas.map((m) => {
          const ganha = m.desbloqueada_em !== null;

          return (
            <li key={m.chave} className="flex">
              <button
                type="button"
                aria-label={ganha ? `Medalha ${m.titulo}` : `Medalha ${m.titulo}, ainda por ganhar`}
                onClick={() => {
                  if (ganha) sons.conquista();
                  else sons.toque();

                  void narrar(`${m.titulo}. ${m.descricao}${ganha ? "" : " Ainda por ganhar."}`);
                }}
                className={cn(
                  "flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-3xl bg-[var(--c-superficie)] px-3 py-3 shadow-[0_5px_0_var(--c-borda)] touch-manipulation",
                  "transition-transform duration-100 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
                  ganha ? "ring-4 ring-[var(--c-alerta)]" : "opacity-55",
                )}
              >
                <span className="relative">
                  <Icone nome={m.icone} aria-hidden className={cn("size-12", ganha ? "text-[var(--c-alerta)]" : "text-[var(--c-tinta)]/60")} strokeWidth={2.25} />
                  {!ganha ? <Lock className="absolute -right-3 -bottom-2 size-6 text-[var(--c-tinta)]/70" aria-hidden /> : null}
                </span>
                <span className="text-center text-lg leading-tight font-black">{exibir(m.titulo, minusculas)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
