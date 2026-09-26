import { Construction } from "lucide-react";

import { PainelPageHeader } from "@/components/painel/page-header";

type EmConstrucaoProps = {
  title: string;
  description?: string;
};

/** Página provisória para as rotas do menu que ainda não têm tela. */
export function EmConstrucao({ title, description }: EmConstrucaoProps) {
  return (
    <div className="space-y-6">
      <PainelPageHeader title={title} description={description} />

      <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="size-6" />
        </span>
        <p className="text-lg font-bold">Em construção</p>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Esta área ainda está sendo preparada. Em breve você poderá usá-la por
          aqui.
        </p>
      </div>
    </div>
  );
}
