"use client";

import { Volume2 } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useFala } from "@/hooks/use-fala";
import { cn } from "@/lib/utils";

/**
 * Alto-falante que repete a instrução/narração da tela. Balança enquanto fala.
 * Toda tela do app da criança deve ter um, no mesmo canto (superior direito).
 */
export function BotaoOuvir({
  texto,
  audioUrl,
  rotulo = "Ouvir de novo",
  className,
}: {
  texto: string;
  audioUrl?: string | null;
  rotulo?: string;
  className?: string;
}) {
  const { falar, falando } = useFala();

  return (
    <BotaoGrande
      rotulo={rotulo}
      cor="primaria"
      tamanho={72}
      className={cn(falando && "animate-crianca-falando", className)}
      onClick={() => void falar(texto, audioUrl)}
    >
      <Volume2 className="size-9" aria-hidden />
    </BotaoGrande>
  );
}
