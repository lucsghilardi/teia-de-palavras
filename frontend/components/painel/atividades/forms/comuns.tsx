"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Config = Record<string, unknown>;

export type FormProps = {
  config: Config;
  onChange: (config: Config) => void;
};

/** Leitura tolerante do JSON: lista, texto e número com padrão. */
export function lista<T = Config>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

export function texto(valor: unknown, padrao = ""): string {
  return typeof valor === "string" ? valor : typeof valor === "number" ? String(valor) : padrao;
}

export function numero(valor: unknown, padrao = 0): number {
  const n = typeof valor === "number" ? valor : Number(valor);

  return Number.isFinite(n) ? n : padrao;
}

export function trocarItem<T>(itens: T[], indice: number, patch: Partial<T>): T[] {
  return itens.map((item, i) => (i === indice ? { ...item, ...patch } : item));
}

export function semItem<T>(itens: T[], indice: number): T[] {
  return itens.filter((_, i) => i !== indice);
}

/** Campo curto de texto com rótulo visível (formulários densos). */
export function Campo({
  rotulo,
  valor,
  onChange,
  tipo = "text",
  placeholder,
  className,
  min,
  max,
}: {
  rotulo: string;
  valor: string | number;
  onChange: (valor: string) => void;
  tipo?: "text" | "number";
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{rotulo}</span>
      <Input
        type={tipo}
        value={valor}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9"
      />
    </label>
  );
}

export function BotaoAdicionar({ rotulo, onClick, disabled }: { rotulo: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick} disabled={disabled}>
      <Plus />
      {rotulo}
    </Button>
  );
}

export function BotaoRemover({ rotulo, onClick, disabled }: { rotulo: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" size="icon-sm" variant="ghost" onClick={onClick} disabled={disabled} aria-label={rotulo} title={rotulo}>
      <Trash2 />
    </Button>
  );
}
