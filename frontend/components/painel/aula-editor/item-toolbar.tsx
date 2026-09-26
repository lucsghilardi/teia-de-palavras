"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ItemToolbarProps = {
  /** Nome do item para leitores de tela (ex.: "página 2"). */
  rotulo: string;
  indice: number;
  total: number;
  onMover?: (delta: -1 | 1) => void;
  onRemover: () => void;
  disabled?: boolean;
};

/** Botões de subir/descer/remover dos itens ordenados do editor. */
export function ItemToolbar({
  rotulo,
  indice,
  total,
  onMover,
  onRemover,
  disabled = false,
}: ItemToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      {onMover ? (
        <>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onMover(-1)}
            disabled={disabled || indice === 0}
            aria-label={`Mover ${rotulo} para cima`}
            title="Mover para cima"
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onMover(1)}
            disabled={disabled || indice === total - 1}
            aria-label={`Mover ${rotulo} para baixo`}
            title="Mover para baixo"
          >
            <ArrowDown />
          </Button>
        </>
      ) : null}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={onRemover}
        disabled={disabled}
        aria-label={`Remover ${rotulo}`}
        title="Remover"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
