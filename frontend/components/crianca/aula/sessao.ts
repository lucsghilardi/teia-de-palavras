"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { UnauthorizedError } from "@/services/apiError";

/** Sessão da criança venceu de vez (o proxy já tentou renovar): volta para a entrada. */
export function useTratarSessao() {
  const router = useRouter();

  return useCallback(
    (erro: unknown): boolean => {
      if (erro instanceof UnauthorizedError) {
        router.replace("/app/entrar");

        return true;
      }

      return false;
    },
    [router],
  );
}
