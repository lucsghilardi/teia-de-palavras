"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { rotuloRevisao } from "@/lib/crianca/revisao";
import { exibir } from "@/lib/exibir";

/** Atalho da Revisão do dia: destaca quando há itens vencidos. */
export function CartaoRevisao({ devidos, minusculas }: { devidos: number; minusculas: boolean }) {
  const router = useRouter();

  return (
    <BotaoGrande
      rotulo={rotuloRevisao(devidos)}
      cor={devidos > 0 ? "sucesso" : "neutra"}
      redondo={false}
      tamanho={96}
      destaque={devidos > 0}
      className="w-full justify-start gap-4 px-4 py-3 text-left"
      onClick={() => router.push("/app/revisao")}
    >
      <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--c-fundo)]/15">
        <RotateCcw className="size-9" strokeWidth={2.5} />
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-2xl font-extrabold sm:text-3xl">{exibir("Revisão", minusculas)}</span>
        <span className="truncate text-base font-bold opacity-80">
          {exibir(devidos > 0 ? (devidos === 1 ? "1 item para hoje" : `${devidos} itens para hoje`) : "tudo em dia", minusculas)}
        </span>
      </span>
    </BotaoGrande>
  );
}
