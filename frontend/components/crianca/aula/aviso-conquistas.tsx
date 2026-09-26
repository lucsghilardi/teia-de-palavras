"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir } from "@/lib/exibir";
import type { Conquista } from "@/types/CriancaApp";

export type LoteConquistas = { id: number; conquistas: Conquista[] };

/**
 * Medalhas novas num aviso rápido no alto da tela. Não bloqueia nada
 * (pointer-events: none) e some sozinho. O som e a fala ficam com quem chama.
 */
export function AvisoConquistas({
  lote,
  minusculas,
  aoSumir,
}: {
  lote: LoteConquistas | null;
  minusculas: boolean;
  aoSumir: () => void;
}) {
  const reduzido = useMovimentoReduzido();

  useEffect(() => {
    if (!lote) return;

    const t = setTimeout(aoSumir, 3500 + lote.conquistas.length * 1200);

    return () => clearTimeout(t);
  }, [lote, aoSumir]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <AnimatePresence>
        {lote && lote.conquistas.length > 0 && (
          <motion.div
            key={lote.id}
            initial={reduzido ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduzido ? 0 : -30 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className="flex max-w-full flex-col gap-2 rounded-[2rem] border-4 border-[var(--c-sol)] bg-white px-5 py-3 shadow-[0_8px_0_var(--c-sol-sombra)]"
          >
            {lote.conquistas.map((c) => (
              <div key={c.chave} className="flex items-center gap-3">
                <span aria-hidden className="text-5xl leading-none">
                  {c.emoji || "🏅"}
                </span>
                <span className="text-xl font-black leading-tight sm:text-2xl">
                  <span className="sr-only">Nova conquista: </span>
                  {exibir(c.titulo, minusculas)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
