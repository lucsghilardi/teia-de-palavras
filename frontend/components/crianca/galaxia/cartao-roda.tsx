"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import { rodaAbertaParaMim } from "@/services/roda";
import type { RodaAberta } from "@/types/Roda";

const INTERVALO_MS = 15000;

/** Avisa quando há uma roda aberta (da turma ou de turma amiga) e leva até ela. Consulta a cada 15 s. */
export function CartaoRoda({ minusculas }: { minusculas: boolean }) {
  const router = useRouter();
  const [roda, setRoda] = useState<RodaAberta | null>(null);

  useEffect(() => {
    let ativo = true;

    const consultar = () => {
      rodaAbertaParaMim()
        .then((r) => {
          if (ativo) setRoda(r.roda);
        })
        .catch(() => {
          // Sem resposta, o cartão só não aparece.
        });
    };

    consultar();
    const intervalo = setInterval(consultar, INTERVALO_MS);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  if (!roda) return null;

  return (
    <BotaoGrande
      rotulo={COPY.roda.entrar(roda.aula.rotulo)}
      cor="alerta"
      redondo={false}
      tamanho={88}
      destaque
      className="w-full justify-start gap-4 px-4 text-left"
      onClick={() => router.push("/app/roda")}
    >
      <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--c-fundo)]/15">
        <Users className="size-9" strokeWidth={2.5} />
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-2xl font-extrabold sm:text-3xl">{exibir(COPY.roda.aberta, minusculas)}</span>
        <span className="truncate text-base font-bold opacity-80">{exibir(`${roda.aula.rotulo} · ${roda.turma.nome}`, minusculas)}</span>
      </span>
    </BotaoGrande>
  );
}
