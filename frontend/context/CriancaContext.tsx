"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UnauthorizedError } from "@/services/apiError";
import { buscarEu, sair as sairApi } from "@/services/crianca";
import type { Eu } from "@/types/CriancaApp";

type Valor = {
  crianca: Eu | null;
  carregando: boolean;
  /** Recarrega /eu (XP, nível, Teia) depois de uma conquista. */
  recarregar: () => Promise<void>;
  /** Atualiza campos localmente sem ir ao servidor (ex.: XP da resposta). */
  atualizar: (parcial: Partial<Eu>) => void;
  sair: () => Promise<void>;
  /** Nível que a criança acabou de alcançar (o aviso de "subiu de nível" mostra); null sem novidade. */
  nivelNovo: number | null;
  /** O aviso de nível foi visto. */
  verNivelNovo: () => void;
};

const CriancaContext = createContext<Valor | null>(null);

export function CriancaProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [crianca, setCrianca] = useState<Eu | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Nível já comemorado: a primeira carga só marca o ponto de partida.
  const [nivelVisto, setNivelVisto] = useState<number | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const eu = await buscarEu();

      setCrianca(eu);
      setNivelVisto((visto) => visto ?? eu.nivel);
    } catch (erro) {
      if (erro instanceof UnauthorizedError) {
        router.replace("/app/entrar");
      }
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void recarregar();
  }, [recarregar]);

  const atualizar = useCallback((parcial: Partial<Eu>) => {
    setCrianca((atual) => (atual ? { ...atual, ...parcial } : atual));
  }, []);

  const sair = useCallback(async () => {
    await sairApi();
    setCrianca(null);
    router.replace("/app/entrar");
  }, [router]);

  const nivelNovo = crianca && nivelVisto !== null && crianca.nivel > nivelVisto ? crianca.nivel : null;

  const verNivelNovo = useCallback(() => {
    setNivelVisto((visto) => Math.max(visto ?? 0, crianca?.nivel ?? 0));
  }, [crianca?.nivel]);

  const valor = useMemo(
    () => ({ crianca, carregando, recarregar, atualizar, sair, nivelNovo, verNivelNovo }),
    [crianca, carregando, recarregar, atualizar, sair, nivelNovo, verNivelNovo],
  );

  return <CriancaContext.Provider value={valor}>{children}</CriancaContext.Provider>;
}

/** Mesmo contexto, mas sem exigir o provedor (telas de entrada, hooks compartilhados). */
export function useCriancaOpcional(): Valor | null {
  return useContext(CriancaContext);
}

export function useCrianca(): Valor {
  const valor = useContext(CriancaContext);

  if (!valor) {
    throw new Error("useCrianca precisa estar dentro de <CriancaProvider>.");
  }

  return valor;
}
