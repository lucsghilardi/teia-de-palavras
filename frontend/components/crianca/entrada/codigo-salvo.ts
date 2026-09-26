"use client";

import { useSyncExternalStore } from "react";

import { CODIGO_TURMA_STORAGE_KEY } from "@/lib/crianca-auth";

/**
 * Código da turma pareada neste dispositivo (localStorage). Não é segredo:
 * sozinho não entra em nada, só lista os bichinhos da turma.
 */
const EVENTO = "teia:codigo-turma-mudou";

/** Só letras e dígitos, em caixa alta (o backend normaliza igual). */
export function normalizarCodigo(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function ler(): string | null {
  try {
    const valor = window.localStorage.getItem(CODIGO_TURMA_STORAGE_KEY);

    return valor ? normalizarCodigo(valor) || null : null;
  } catch {
    return null;
  }
}

function assinar(callback: () => void) {
  window.addEventListener(EVENTO, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(EVENTO, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * `undefined` enquanto não dá para saber (servidor/hidratação), `null` sem
 * código salvo, ou o código.
 */
export function useCodigoSalvo(): string | null | undefined {
  return useSyncExternalStore(assinar, ler, () => undefined);
}

export function salvarCodigo(codigo: string) {
  try {
    window.localStorage.setItem(CODIGO_TURMA_STORAGE_KEY, normalizarCodigo(codigo));
  } catch {
    // Navegação privada/armazenamento cheio: segue só nesta visita.
  }

  window.dispatchEvent(new Event(EVENTO));
}

export function esquecerCodigo() {
  try {
    window.localStorage.removeItem(CODIGO_TURMA_STORAGE_KEY);
  } catch {
    // idem
  }

  window.dispatchEvent(new Event(EVENTO));
}
