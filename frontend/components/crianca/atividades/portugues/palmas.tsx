"use client";

import { Hand } from "lucide-react";
import { useAnimate } from "motion/react";
import { useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { celebrar } from "@/components/crianca/aula/celebrar";
import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { corDaPeca } from "@/components/crianca/ui/peca";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir, exibirPalavra } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadePalmas } from "@/types/CriancaApp";

/**
 * PALMAS: a palavra escondida em caixinhas, uma por sílaba. Cada palma revela
 * e fala a próxima sílaba. Na última, a palavra inteira é falada devagar,
 * sílaba por sílaba, e comemoramos. Palmas extras só repetem.
 */
export function Palmas({ aula, atividade, minusculas, aoConcluir, definirInstrucao }: PropsAtividade<AtividadePalmas>) {
  const reduzido = useMovimentoReduzido();
  const palavra = aula.palavra_geradora ?? aula.rotulo;
  const silabas =
    atividade.silabas.length > 0 ? atividade.silabas : [{ texto: palavra, audio_url: aula.palavra_audio_url }];
  const total = silabas.length;
  const [batidas, setBatidas] = useState(0);
  const [destacada, setDestacada] = useState<number | null>(null);
  const [fimNarrado, setFimNarrado] = useState(false);
  const [pulo, setPulo] = useState(0);
  const [escopo, animar] = useAnimate<HTMLDivElement>();
  const completo = batidas >= total;

  const instrucao = {
    texto: `Vamos bater palmas! Uma palma para cada pedaço da palavra ${palavra}. Toque no botão de palmas.`,
  };
  const narrou = useNarracaoDeChegada("palmas", [instrucao], instrucao, definirInstrucao);

  const terminar = async () => {
    // Palavra inteira, devagar, destacando cada caixinha.
    const inteira = await narrar(silabas, 550, (i) => setDestacada(i));

    if (inteira) {
      setDestacada(null);
      celebrar(reduzido);
      await narrar(`${total} ${total === 1 ? "palma" : "palmas"}!`);
    }

    setFimNarrado(true);
  };

  const palma = () => {
    sons.palma();
    setPulo((p) => p + 1);

    if (!reduzido && escopo.current) {
      void animar(escopo.current, { scale: [0.86, 1.06, 1], rotate: [-6, 3, 0] }, { duration: 0.35 });
    }

    if (batidas < total) {
      const i = batidas;
      setBatidas(i + 1);
      setDestacada(i);

      if (i + 1 === total) {
        void narrar(silabas[i]).then((ok) => (ok ? terminar() : setFimNarrado(true)));
      } else {
        void narrar(silabas[i]);
      }

      return;
    }

    // Já completou: cada palma repete uma sílaba, em ordem.
    const i = (pulo % total + total) % total;
    setDestacada(i);
    void narrar(silabas[i]);
  };

  return (
    <section aria-label="Palmas" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 landscape:flex-row landscape:gap-10">
        <ol aria-label="Pedaços da palavra" className="flex flex-wrap items-center justify-center gap-3">
          {silabas.map((s, i) => {
            const revelada = i < batidas;

            return (
              <li key={i}>
                {revelada ? (
                  <button
                    type="button"
                    aria-label={`Sílaba ${s.texto}`}
                    onClick={() => {
                      sons.toque();
                      setDestacada(i);
                      void narrar(s);
                    }}
                    className={cn(
                      "animate-crianca-entrar flex min-h-24 min-w-24 items-center justify-center rounded-[1.75rem] px-4 font-black",
                      "text-[clamp(2.5rem,8vw,4.5rem)] transition-transform duration-150 touch-manipulation",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]",
                      corDaPeca(s.texto),
                      destacada === i && "scale-110 ring-4 ring-[var(--c-primaria)] ring-offset-2 ring-offset-[var(--c-fundo)]",
                    )}
                  >
                    {exibirPalavra(s.texto, minusculas)}
                  </button>
                ) : (
                  <div
                    aria-hidden
                    className="flex min-h-24 min-w-24 items-center justify-center rounded-[1.75rem] border-4 border-dashed border-[var(--c-borda)] bg-[var(--c-superficie)] text-5xl font-black text-white/20"
                  >
                    ?
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col items-center gap-3">
          <div ref={escopo}>
            <BotaoGrande rotulo="Palma" cor="alerta" tamanho={152} destaque={narrou && !completo} onClick={palma}>
              <Hand className="size-20" strokeWidth={2} aria-hidden />
            </BotaoGrande>
          </div>

          {completo && (
            <p className="animate-crianca-entrar rounded-full bg-[var(--c-superficie)] px-5 py-2 text-3xl font-black text-[var(--c-sucesso)] shadow-[0_4px_0_var(--c-borda)]">
              {exibir(`${total} ${total === 1 ? "palma" : "palmas"}!`, minusculas)}
            </p>
          )}
        </div>
      </div>

      <div className="flex min-h-[88px] shrink-0 justify-end">
        {completo && <BotaoContinuar destaque={fimNarrado} onClick={aoConcluir} className="animate-crianca-entrar" />}
      </div>
    </section>
  );
}
