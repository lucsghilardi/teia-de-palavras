"use client";

import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";

import { VisualOpcao } from "@/components/crianca/comum/visual-opcao";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { COPY } from "@/lib/copy";
import { progressoDoNivel } from "@/lib/crianca/nivel";
import { exibir } from "@/lib/exibir";
import type { Eu } from "@/types/CriancaApp";

/** Topo da Galáxia: avatar + nível + sequência (um toque abre "eu") e o alto-falante. */
export function CabecalhoEu({ crianca, instrucao }: { crianca: Eu | null; instrucao: string }) {
  const router = useRouter();
  const minusculas = crianca?.usa_minusculas ?? true;
  const progresso = crianca ? progressoDoNivel(crianca.xp_no_nivel, crianca.xp_para_proximo) : 0;
  const sequencia = crianca?.sequencia_dias ?? 0;

  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-2 sm:px-6">
      <BotaoGrande
        rotulo={COPY.galaxia.perfil}
        cor="neutra"
        redondo={false}
        tamanho={72}
        className="min-w-0 max-w-full justify-start gap-3 py-1 pr-5 pl-1"
        onClick={() => router.push("/app/eu")}
      >
        <VisualOpcao opcao={crianca?.avatar} className="size-14 shrink-0" />
        <span aria-hidden className="flex min-w-0 flex-col items-start gap-1 leading-tight">
          <span className="max-w-[40vw] truncate text-xl font-extrabold sm:max-w-xs sm:text-2xl">
            {crianca ? exibir(crianca.apelido, minusculas) : " "}
          </span>
          <span className="flex items-center gap-2 text-sm font-bold text-[var(--c-tinta-suave)]">
            <span className="whitespace-nowrap">{exibir(`Nível ${crianca?.nivel ?? 1}`, minusculas)}</span>
            <span className="h-2 w-16 overflow-hidden rounded-full bg-[var(--c-borda)]">
              <span className="block h-full rounded-full bg-[var(--c-primaria)]" style={{ width: `${Math.round(progresso * 100)}%` }} />
            </span>
            <Flame className={sequencia > 0 ? "size-4 fill-[var(--c-destaque)] text-[var(--c-destaque)]" : "size-4 opacity-50"} />
            <span className="tabular-nums">{sequencia}</span>
          </span>
        </span>
      </BotaoGrande>

      <div className="ml-auto shrink-0">
        <BotaoOuvir texto={instrucao} />
      </div>
    </header>
  );
}
