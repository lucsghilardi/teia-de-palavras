"use client";

import { Check, Hourglass, RotateCcw } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import type { CriancaNaRoda } from "@/types/Roda";

type Props = {
  parceiro: CriancaNaRoda;
  minhaVez: boolean;
  /** Descrição da proposta aberta do par (null = sem proposta). */
  propostaDoPar: string | null;
  /** Eu propus e espero o par. */
  esperandoPar: boolean;
  /** Última avaliação (para o par que confirmou ver o resultado). */
  ultimoResultado: string | null;
  minusculas: boolean;
  enviando: boolean;
  aoResponder: (aceitar: boolean) => void;
};

/**
 * Faixa da dupla, acima da atividade: de quem é a vez, a proposta do par
 * (com "concordo" / "vamos mudar") e o resultado do que foi confirmado.
 */
export function PainelDupla({ parceiro, minhaVez, propostaDoPar, esperandoPar, ultimoResultado, minusculas, enviando, aoResponder }: Props) {
  const texto = propostaDoPar
    ? COPY.roda.propos(parceiro.apelido, propostaDoPar)
    : esperandoPar
      ? COPY.roda.esperandoPar(parceiro.apelido)
      : minhaVez
        ? COPY.roda.suaVez(parceiro.apelido)
        : COPY.roda.vezDe(parceiro.apelido);

  return (
    <section
      aria-label="Dupla"
      className="mx-3 flex flex-col gap-3 rounded-3xl bg-[var(--c-superficie)] px-4 py-3 ring-2 ring-inset ring-[var(--c-borda)] sm:mx-6"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]"
          style={{ backgroundColor: parceiro.avatar?.cor ?? "var(--c-superficie-2)" }}
        >
          <Icone nome={parceiro.avatar?.icone ?? "user"} className="size-7" strokeWidth={2.25} />
        </span>
        <p role="status" className="min-w-0 flex-1 text-lg font-extrabold leading-tight sm:text-xl">
          {exibir(texto, minusculas)}
        </p>
        {esperandoPar ? <Hourglass className="size-8 shrink-0 animate-crianca-pulso text-[var(--c-alerta)]" aria-hidden /> : null}
      </div>

      {propostaDoPar ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <BotaoGrande rotulo={COPY.roda.concordo} cor="sucesso" tamanho={80} destaque className="px-6" disabled={enviando} onClick={() => aoResponder(true)}>
            <Check className="size-10" aria-hidden strokeWidth={3} />
            <span aria-hidden>{exibir(COPY.roda.concordo, minusculas)}</span>
          </BotaoGrande>
          <BotaoGrande rotulo={COPY.roda.mudar} cor="alerta" tamanho={80} className="px-6" disabled={enviando} onClick={() => aoResponder(false)}>
            <RotateCcw className="size-10" aria-hidden strokeWidth={2.5} />
            <span aria-hidden>{exibir(COPY.roda.mudar, minusculas)}</span>
          </BotaoGrande>
        </div>
      ) : null}

      {!propostaDoPar && ultimoResultado ? (
        <p className="text-base font-bold text-[var(--c-tinta-suave)]">{exibir(ultimoResultado, minusculas)}</p>
      ) : null}
    </section>
  );
}
