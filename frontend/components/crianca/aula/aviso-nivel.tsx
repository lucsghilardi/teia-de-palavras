"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

import { narrar } from "@/components/crianca/aula/narrador";
import { MascoteSolo } from "@/components/crianca/ilustracoes/personagens";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCriancaOpcional } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { COPY } from "@/lib/copy";
import { fireConfetti } from "@/lib/confetti";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";

const TEMPO_NA_TELA_MS = 6000;

/**
 * "Subiu de nível!": o mascote comemora por cima de qualquer tela da criança.
 * Some sozinho em alguns segundos ou com um toque; nunca espera a fala acabar.
 */
export function AvisoNivel() {
  const contexto = useCriancaOpcional();
  const reduzido = useMovimentoReduzido();
  const nivel = contexto?.nivelNovo ?? null;
  const ver = contexto?.verNivelNovo;
  const minusculas = contexto?.crianca?.usa_minusculas ?? false;

  useEffect(() => {
    if (nivel === null || !ver) return;

    sons.conquista();

    if (!reduzido) {
      try {
        fireConfetti();
      } catch {
        // canvas indisponível: a fanfarra já basta
      }
    }

    void narrar(COPY.nivel.subiu(nivel));
    const t = setTimeout(ver, TEMPO_NA_TELA_MS);

    return () => clearTimeout(t);
  }, [nivel, ver, reduzido]);

  return (
    <AnimatePresence>
      {nivel !== null && ver && (
        <motion.div
          key={nivel}
          role="dialog"
          aria-modal="false"
          aria-label={COPY.nivel.subiu(nivel)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--c-fundo)]/75 px-4"
          onClick={ver}
        >
          <motion.div
            initial={reduzido ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="flex w-full max-w-md flex-col items-center gap-3 rounded-[2.5rem] border-4 border-[var(--c-alerta)] bg-[var(--c-superficie)] px-6 py-6 shadow-[0_10px_0_var(--c-alerta-sombra)]"
          >
            <MascoteSolo pose="comemorando" className="h-40 w-auto" />
            <p className="text-center text-[clamp(1.75rem,6vw,2.5rem)] font-black leading-tight text-[var(--c-alerta)]">
              {exibir(COPY.nivel.subiu(nivel), minusculas)}
            </p>
            <BotaoGrande rotulo={COPY.nivel.fechar} cor="sucesso" tamanho={88} destaque className="px-8" onClick={ver}>
              <ArrowRight className="size-11" strokeWidth={3} aria-hidden />
            </BotaoGrande>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
