"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { COPY } from "@/lib/copy";
import { rotuloCartaoAmigos } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";

/** Base dos amigos: aulas recebidas (destaca quando há nova) e dar uma aula. */
export function CartaoAmigos({ novas, minusculas }: { novas: number; minusculas: boolean }) {
  const router = useRouter();

  return (
    <BotaoGrande
      rotulo={rotuloCartaoAmigos(novas)}
      cor={novas > 0 ? "primaria" : "neutra"}
      redondo={false}
      tamanho={80}
      destaque={novas > 0}
      className="w-full justify-start gap-4 px-4 text-left"
      onClick={() => router.push("/app/amigos")}
    >
      <span aria-hidden className={`flex size-14 shrink-0 items-center justify-center rounded-full ${novas > 0 ? "bg-[var(--c-fundo)]/15" : "bg-[var(--c-superficie-2)]"}`}>
        <Users className="size-8" strokeWidth={2.25} />
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-xl font-extrabold sm:text-2xl">{exibir(COPY.amigos.titulo, minusculas)}</span>
        <span className={`truncate text-base font-bold ${novas > 0 ? "opacity-80" : "text-[var(--c-tinta-suave)]"}`}>
          {exibir(novas > 0 ? (novas === 1 ? "1 aula nova" : `${novas} aulas novas`) : COPY.amigos.darAula, minusculas)}
        </span>
      </span>
    </BotaoGrande>
  );
}
