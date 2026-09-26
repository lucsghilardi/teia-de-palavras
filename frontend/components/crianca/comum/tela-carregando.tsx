import { Orbit } from "lucide-react";

import { cn } from "@/lib/utils";

/** Espera curta, sem texto: uma órbita que pulsa (parada com movimento reduzido). */
export function TelaCarregando({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Carregando" className={cn("flex min-h-dvh items-center justify-center", className)}>
      <Orbit aria-hidden className="size-20 animate-crianca-pulso text-[var(--c-primaria)]" strokeWidth={1.75} />
    </div>
  );
}
