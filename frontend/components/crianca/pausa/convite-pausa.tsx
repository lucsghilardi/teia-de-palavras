"use client";

import { CupSoda, LogOut, PersonStanding, Play } from "lucide-react";

import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { exibir } from "@/lib/exibir";

export const FALA_PAUSA = "Você já brincou bastante! Que tal beber água e esticar o corpo?";

/** Convite de pausa em tela cheia (nunca obriga: dá para continuar). */
export function ConvitePausa({
  minusculas,
  onContinuar,
  onSair,
}: {
  minusculas: boolean;
  onContinuar: () => void;
  onSair: () => void;
}) {
  useFalarAoChegar(FALA_PAUSA);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hora de uma pausa"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[color-mix(in_srgb,var(--c-fundo)_92%,transparent)] backdrop-blur-sm"
    >
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <BotaoOuvir texto={FALA_PAUSA} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center animate-crianca-entrar">
        <div aria-hidden className="flex gap-6 text-[var(--c-primaria)]">
          <CupSoda className="size-24 sm:size-28" strokeWidth={1.75} />
          <PersonStanding className="size-24 sm:size-28" strokeWidth={1.75} />
        </div>

        <h2 className="text-4xl font-black sm:text-5xl">{exibir("Hora de uma pausa!", minusculas)}</h2>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <BotaoGrande
            rotulo="Continuar"
            cor="sucesso"
            redondo={false}
            tamanho={88}
            className="px-8"
            onClick={onContinuar}
            autoFocus
          >
            <Play className="size-9 fill-current" aria-hidden />
            {exibir("Continuar", minusculas)}
          </BotaoGrande>

          <BotaoGrande rotulo="Sair" cor="alerta" redondo={false} tamanho={88} className="px-8" onClick={onSair}>
            <LogOut className="size-9" aria-hidden />
            {exibir("Sair", minusculas)}
          </BotaoGrande>
        </div>
      </div>
    </div>
  );
}
