"use client";

import { ArrowLeft } from "lucide-react";
import { useAnimate } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { VisualOpcao } from "@/components/crianca/comum/visual-opcao";
import type { CriancaEntrada } from "@/components/crianca/entrada/quem-e-voce";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/apiError";
import { entrar } from "@/services/crianca";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

export type MotivoTrava = "adulto" | "espera";

export const FALA_CHAMAR_ADULTO = "Vamos chamar um adulto para ajudar?";
export const FALA_ESPERAR = "Vamos esperar um pouquinho? Depois a gente tenta de novo.";
const FALA_TENTAR_DE_NOVO = "Hmm, não é essa figura. Vamos tentar de novo?";
const FALA_SEM_CONEXAO = "Ops! Não consegui entrar agora. Vamos tentar de novo?";

/** Passo 3 da entrada: a figura secreta (grade 3×3), que faz o login. */
export function FiguraSecreta({
  codigoTurma,
  crianca,
  figuras,
  onVoltar,
  onTravar,
  onNaoEncontrada,
}: {
  codigoTurma: string;
  crianca: CriancaEntrada;
  figuras: OpcaoVisual[];
  onVoltar: () => void;
  onTravar: (motivo: MotivoTrava, mensagem: string) => void;
  /** 404 no login: a criança saiu da turma — volta e recarrega a lista. */
  onNaoEncontrada: (mensagem: string) => void;
}) {
  const router = useRouter();
  const movimentoReduzido = useMovimentoReduzido();
  const [escopo, animar] = useAnimate<HTMLUListElement>();
  const [enviando, setEnviando] = useState<string | null>(null);

  const instrucao = `${crianca.apelido}! Qual é a sua figura secreta? Toque nela.`;
  useFalarAoChegar(instrucao);

  function balancar() {
    if (movimentoReduzido || !escopo.current) return;

    void animar(escopo.current, { x: [0, -18, 18, -12, 12, -6, 6, 0] }, { duration: 0.5, ease: "easeInOut" });
  }

  async function escolher(figura: OpcaoVisual) {
    if (enviando) return;

    sons.toque();
    setEnviando(figura.chave);

    try {
      await entrar({ codigo_turma: codigoTurma, crianca_id: crianca.id, figura_chave: figura.chave });
      sons.acerto();
      router.replace("/app");
      // Fica "enviando" de propósito: nada de toques extras durante a navegação.
    } catch (erro) {
      setEnviando(null);

      if (!(erro instanceof ApiError)) {
        sons.dica();
        void falar(FALA_SEM_CONEXAO);

        return;
      }

      const corpo = (erro.body ?? {}) as { message?: string; errors?: unknown };

      if (erro.status === 422 && !corpo.errors) {
        sons.dica();
        balancar();
        void falar(corpo.message || FALA_TENTAR_DE_NOVO);
      } else if (erro.status === 423) {
        onTravar("adulto", corpo.message || FALA_CHAMAR_ADULTO);
      } else if (erro.status === 429) {
        // O throttle do Laravel responde em inglês: a fala é sempre a nossa.
        onTravar("espera", FALA_ESPERAR);
      } else if (erro.status === 404) {
        onNaoEncontrada(corpo.message || FALA_CHAMAR_ADULTO);
      } else {
        sons.dica();
        void falar(FALA_SEM_CONEXAO);
      }
    }
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao}>
        <BotaoGrande rotulo="Voltar" cor="branco" tamanho={72} onClick={onVoltar} disabled={enviando !== null}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <div className="flex min-w-0 items-center gap-2">
          <VisualOpcao opcao={crianca.avatar} className="size-14 shrink-0 text-5xl" />
          <span className="truncate text-2xl font-black tracking-wide">{exibir(crianca.apelido)}</span>
        </div>
        <h1 className="sr-only">Qual é a sua figura secreta?</h1>
      </BarraTopo>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-8">
        <span aria-hidden className="text-5xl">
          🤫
        </span>
        <ul
          ref={escopo}
          aria-label="Figuras secretas"
          className="grid w-full max-w-[max(15rem,min(32rem,calc(100dvh-12rem)))] grid-cols-3 gap-3 sm:gap-4"
        >
          {figuras.map((figura) => {
            const escolhida = enviando === figura.chave;

            return (
              <li key={figura.chave}>
                <button
                  type="button"
                  aria-label={figura.rotulo}
                  disabled={enviando !== null}
                  onClick={() => void escolher(figura)}
                  className={cn(
                    "flex aspect-square w-full min-h-16 min-w-16 items-center justify-center rounded-3xl bg-white p-2",
                    "shadow-[0_6px_0_var(--c-borda)] transition-transform duration-100 active:translate-y-1 active:shadow-none",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] touch-manipulation",
                    enviando !== null && !escolhida && "opacity-50",
                    escolhida && "ring-4 ring-[var(--c-teia)] ring-offset-2",
                  )}
                >
                  <VisualOpcao opcao={figura} className="size-[70%] text-[clamp(3rem,14vmin,5.5rem)]" reserva="❓" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
