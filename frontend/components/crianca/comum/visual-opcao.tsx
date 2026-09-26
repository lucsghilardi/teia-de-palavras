import { User } from "lucide-react";

import { Icone } from "@/components/crianca/ui/icone";
import { cn } from "@/lib/utils";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

/**
 * Figura de uma OpcaoVisual (avatar ou figura secreta): a imagem enviada pelo
 * painel, se houver; senão o ícone na cor da opção. Decorativa — o nome
 * acessível fica no botão.
 */
export function VisualOpcao({
  opcao,
  className,
  reserva = "user",
}: {
  opcao: OpcaoVisual | null | undefined;
  /** Tamanho (size-*): controla a imagem ou o círculo do ícone. */
  className?: string;
  /** Ícone quando a opção não tem imagem nem ícone. */
  reserva?: string;
}) {
  if (opcao?.imagem_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- host da mídia muda por ambiente
      <img
        src={opcao.imagem_url}
        alt=""
        aria-hidden
        draggable={false}
        loading="lazy"
        decoding="async"
        className={cn("pointer-events-none select-none object-contain", className)}
      />
    );
  }

  const nome = opcao?.icone || reserva;

  return (
    <span
      aria-hidden
      style={{ backgroundColor: opcao?.cor ?? "var(--c-superficie-2)" }}
      className={cn("pointer-events-none inline-flex select-none items-center justify-center rounded-full text-[var(--c-fundo)]", className)}
    >
      {nome === "user" ? <User className="size-[62%]" strokeWidth={2.25} /> : <Icone nome={nome} className="size-[62%]" strokeWidth={2.25} />}
    </span>
  );
}
