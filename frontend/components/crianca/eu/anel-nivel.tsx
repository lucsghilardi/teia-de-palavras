import { VisualOpcao } from "@/components/crianca/comum/visual-opcao";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

const RAIO = 56;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/** Avatar dentro de um anel que enche conforme o XP do nível. */
export function AnelNivel({ nivel, progresso, avatar }: { nivel: number; progresso: number; avatar: OpcaoVisual | null | undefined }) {
  const fracao = Math.min(1, Math.max(0, progresso));

  return (
    <div role="img" aria-label={`Nível ${nivel}`} className="relative size-36 shrink-0">
      <svg aria-hidden viewBox="0 0 128 128" className="absolute inset-0 size-full -rotate-90">
        <circle cx="64" cy="64" r={RAIO} fill="white" stroke="var(--c-borda)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={RAIO}
          fill="none"
          stroke="var(--c-teia)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - fracao)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <VisualOpcao opcao={avatar} className="size-20 text-7xl" />
      </span>
      <span
        aria-hidden
        className="absolute -right-1 -bottom-1 flex size-12 items-center justify-center rounded-full bg-[var(--c-teia)] text-2xl font-black text-white shadow-[0_3px_0_var(--c-teia-sombra)]"
      >
        {nivel}
      </span>
    </div>
  );
}
