import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { cn } from "@/lib/utils";

/**
 * Faixa de cima de toda tela da criança: ações à esquerda/centro e, sempre no
 * canto superior direito, o alto-falante que repete a instrução.
 */
export function BarraTopo({
  instrucao,
  audioUrl,
  children,
  className,
}: {
  instrucao: string;
  audioUrl?: string | null;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center gap-3 px-4 pt-4 pb-2 sm:px-6", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <BotaoOuvir texto={instrucao} audioUrl={audioUrl} className="shrink-0" />
    </header>
  );
}
