"use client";

import { ArrowLeft } from "lucide-react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import type { MotivoTrava } from "@/components/crianca/entrada/figura-secreta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { exibir } from "@/lib/exibir";

/**
 * Entrada travada (muitas figuras seguidas, 423) ou pedidos demais (429):
 * nada de bronca — chama um adulto / espera um pouco, e um botão de voltar.
 */
export function PedirAdulto({
  motivo,
  mensagem,
  onVoltar,
}: {
  motivo: MotivoTrava;
  mensagem: string;
  onVoltar: () => void;
}) {
  useFalarAoChegar(mensagem);

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={mensagem} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center">
        <div aria-hidden className="flex items-end gap-2 text-8xl sm:text-9xl">
          <span>{motivo === "adulto" ? "🔒" : "⏳"}</span>
          <span>🧑‍🏫</span>
        </div>

        <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-4xl">{exibir(mensagem)}</h1>

        <BotaoGrande rotulo="Voltar" cor="ceu" redondo={false} tamanho={80} onClick={onVoltar} className="px-8">
          <ArrowLeft className="size-9" aria-hidden />
          {exibir("Voltar")}
        </BotaoGrande>
      </div>
    </main>
  );
}
