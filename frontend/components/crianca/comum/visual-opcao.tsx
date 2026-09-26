import { cn } from "@/lib/utils";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

/**
 * Figura de uma OpcaoVisual (avatar ou figura secreta): a imagem enviada pelo
 * painel, se houver, senão o emoji. Decorativa — o nome acessível fica no botão.
 */
export function VisualOpcao({
  opcao,
  className,
  reserva = "🙂",
}: {
  opcao: OpcaoVisual | null | undefined;
  /** Tamanho: controla a imagem (size-*) e o emoji (text-*). */
  className?: string;
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

  return (
    <span aria-hidden className={cn("pointer-events-none inline-flex select-none items-center justify-center leading-none", className)}>
      {opcao?.emoji || reserva}
    </span>
  );
}
