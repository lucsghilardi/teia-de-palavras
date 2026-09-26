"use client";

import { ArrowRight } from "lucide-react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { Pontinhos } from "@/components/crianca/aula/pontinhos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { cn } from "@/lib/utils";

/** Cartão do enunciado (pergunta/instrução) com um ícone opcional. */
export function Enunciado({ texto, icone, className }: { texto: string; icone?: string | null; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-3xl items-center gap-4 rounded-[2rem] bg-white px-5 py-4 shadow-[0_6px_0_var(--c-borda)]",
        className,
      )}
    >
      {icone ? <Icone nome={icone} aria-hidden className="size-12 shrink-0 text-[var(--c-teia)]" strokeWidth={2.25} /> : null}
      <p className="text-[clamp(1.25rem,3.2vw,2rem)] font-extrabold leading-snug">{texto}</p>
    </div>
  );
}

/**
 * Rodapé padrão das atividades com vários itens: bolinhas de progresso e o
 * botão de seguir ("Próximo" entre itens; "Continuar" no fim), que só aparece
 * quando o item atual está resolvido.
 */
export function RodapeItens({
  total,
  atual,
  resolvido,
  aoProximo,
  aoConcluir,
}: {
  total: number;
  atual: number;
  resolvido: boolean;
  aoProximo: () => void;
  aoConcluir: () => void;
}) {
  const ultimo = atual >= total - 1;

  return (
    <div className="flex min-h-[88px] shrink-0 items-center justify-between gap-3">
      <div aria-hidden className="w-20" />
      <Pontinhos total={total} atual={atual} />
      {resolvido ? (
        ultimo ? (
          <BotaoContinuar destaque onClick={aoConcluir} className="animate-crianca-entrar" />
        ) : (
          <BotaoGrande rotulo="Próximo" cor="ceu" tamanho={88} destaque className="animate-crianca-entrar px-8" onClick={aoProximo}>
            <ArrowRight className="size-11" strokeWidth={3} aria-hidden />
          </BotaoGrande>
        )
      ) : (
        <div aria-hidden className="w-20" />
      )}
    </div>
  );
}

/** Aparência de uma opção depois da resposta: certa, a que não deu, ou neutra. */
export function classeDaOpcao(estado: "certa" | "nao" | "neutra" | "apagada"): string {
  switch (estado) {
    case "certa":
      return "ring-4 ring-[var(--c-grama)] bg-white";
    case "nao":
      return "opacity-45";
    case "apagada":
      return "opacity-30";
    default:
      return "";
  }
}
