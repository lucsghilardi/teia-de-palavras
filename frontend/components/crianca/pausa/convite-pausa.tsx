"use client";

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
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[color-mix(in_srgb,#DFF6FF_96%,transparent)] backdrop-blur-sm"
    >
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <BotaoOuvir texto={FALA_PAUSA} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center animate-crianca-entrar">
        <div aria-hidden className="flex gap-4 text-8xl sm:text-9xl">
          <span>🧃</span>
          <span>🤸</span>
        </div>

        <h2 className="text-4xl font-black sm:text-5xl">{exibir("Hora de uma pausa!", minusculas)}</h2>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <BotaoGrande
            rotulo="Continuar"
            cor="grama"
            redondo={false}
            tamanho={88}
            className="px-8"
            onClick={onContinuar}
            autoFocus
          >
            <span aria-hidden className="text-4xl">
              ▶
            </span>
            {exibir("Continuar", minusculas)}
          </BotaoGrande>

          <BotaoGrande rotulo="Sair" cor="sol" redondo={false} tamanho={88} className="px-8" onClick={onSair}>
            <span aria-hidden className="text-4xl">
              👋
            </span>
            {exibir("Sair", minusculas)}
          </BotaoGrande>
        </div>
      </div>
    </div>
  );
}
