"use client";

import { Lightbulb, Star, ThumbsUp, type LucideIcon } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { COPY } from "@/lib/copy";
import { REACOES } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";
import type { Reacao } from "@/types/CriancaApp";

export const ICONE_REACAO: Record<Reacao, LucideIcon> = { valeu: ThumbsUp, aprendi: Lightbulb, top: Star };

/** Três reações fixas (sem texto livre entre crianças): valeu, aprendi, top. */
export function Reacoes({ minusculas, enviando, aoReagir }: { minusculas: boolean; enviando: boolean; aoReagir: (reacao: Reacao) => void }) {
  return (
    <ul aria-label="Reações" className="flex flex-wrap items-center justify-center gap-4">
      {REACOES.map((reacao, i) => {
        const Icone = ICONE_REACAO[reacao];

        return (
          <li key={reacao} className="animate-crianca-entrar" style={{ animationDelay: `${i * 80}ms` }}>
            <BotaoGrande
              rotulo={COPY.amigos.reacoes[reacao]}
              cor={reacao === "top" ? "alerta" : reacao === "aprendi" ? "sucesso" : "primaria"}
              redondo={false}
              tamanho={112}
              className="flex-col gap-1 px-8"
              disabled={enviando}
              onClick={() => aoReagir(reacao)}
            >
              <Icone className="size-12" aria-hidden strokeWidth={2.25} />
              <span aria-hidden className="text-xl">
                {exibir(COPY.amigos.reacoes[reacao], minusculas)}
              </span>
            </BotaoGrande>
          </li>
        );
      })}
    </ul>
  );
}
