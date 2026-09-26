"use client";

import { ArrowRight } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { cn } from "@/lib/utils";

/** Botão verde de seguir em frente. Pulsa (destaque) quando é o próximo passo esperado. */
export function BotaoContinuar({
  onClick,
  destaque = false,
  rotulo = "Continuar",
  className,
}: {
  onClick: () => void;
  destaque?: boolean;
  rotulo?: string;
  className?: string;
}) {
  return (
    <BotaoGrande
      rotulo={rotulo}
      cor="grama"
      tamanho={88}
      destaque={destaque}
      onClick={onClick}
      className={cn("px-10", className)}
    >
      <ArrowRight className="size-11" strokeWidth={3} aria-hidden />
    </BotaoGrande>
  );
}
