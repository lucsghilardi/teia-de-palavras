"use client";

import type { LucideProps } from "lucide-react";
import { createElement } from "react";

import { iconePorNome } from "@/lib/icones";

/**
 * Ícone citado pelo nome no conteúdo (JSON das atividades, avatares,
 * medalhas). Nome desconhecido vira "sparkles". `createElement` evita criar
 * um componente novo a cada render (regra react-hooks/static-components).
 */
export function Icone({ nome, ...props }: LucideProps & { nome: string | null | undefined }) {
  return createElement(iconePorNome(nome), props);
}
