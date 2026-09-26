import { cn } from "@/lib/utils";

/** Espera curtinha, sem texto: uma aranha que pulsa (parada com movimento reduzido). */
export function TelaCarregando({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Carregando" className={cn("flex min-h-dvh items-center justify-center", className)}>
      <span aria-hidden className="animate-crianca-pulso text-7xl">
        🕷️
      </span>
    </div>
  );
}
