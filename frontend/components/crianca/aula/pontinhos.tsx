import { cn } from "@/lib/utils";

/** Bolinhas de progresso (decorativas): página/pergunta atual em destaque. */
export function Pontinhos({ total, atual }: { total: number; atual: number }) {
  if (total <= 1) return null;

  return (
    <div aria-hidden className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-3 rounded-full transition-all duration-200",
            i === atual ? "w-8 bg-[var(--c-teia)]" : i < atual ? "w-3 bg-[var(--c-teia)]/50" : "w-3 bg-black/15",
          )}
        />
      ))}
    </div>
  );
}
