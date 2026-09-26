"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { caixaAlta } from "@/lib/silabas";

type CaixaAltaInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onValueChange: (valor: string) => void;
};

/**
 * Campo de texto que converte para caixa alta enquanto digita (palavras e
 * sílabas da Fase 1) sem jogar o cursor para o fim: o valor convertido é
 * escrito no próprio elemento antes do setState, preservando a seleção.
 */
export function CaixaAltaInput({ value, onValueChange, ...props }: CaixaAltaInputProps) {
  return (
    <Input
      {...props}
      value={value}
      onChange={(event) => {
        const campo = event.target;
        const convertido = caixaAlta(campo.value);

        if (convertido !== campo.value) {
          const { selectionStart, selectionEnd } = campo;

          campo.value = convertido;

          if (selectionStart !== null && selectionEnd !== null) {
            campo.setSelectionRange(selectionStart, selectionEnd);
          }
        }

        onValueChange(convertido);
      }}
    />
  );
}
