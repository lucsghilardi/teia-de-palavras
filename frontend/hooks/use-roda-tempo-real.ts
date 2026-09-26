"use client";

import { useEffect, useRef, useState } from "react";

import { getEcho, getEchoCrianca } from "@/lib/echo";
import type { DuplaEstado, MembroRoda, RodaEstado } from "@/types/Roda";

type Opcoes = {
  rodaId: number | null;
  perfil: "educador" | "crianca";
  /** Snapshot novo da roda (substitui o estado local). */
  aoEstado: (estado: RodaEstado) => void;
  /** Snapshot novo de uma dupla (a criança filtra pela sua). */
  aoDupla?: (dupla: DuplaEstado) => void;
  /** Busca o snapshot pela API: ao (re)conectar e no polling de reserva. */
  recarregar: () => void | Promise<void>;
};

/**
 * Tempo real da Roda: entra no canal de presença `roda.{id}`, escuta
 * `.roda.atualizada` e `.dupla.atualizada`, mantém quem está online e, sem
 * websocket (Reverb fora do ar, rede ruim), cai para polling a cada 5 s.
 * Os callbacks ficam em refs: trocar de função não reassina o canal.
 */
export function useRodaTempoReal({ rodaId, perfil, aoEstado, aoDupla, recarregar }: Opcoes) {
  const [conectado, setConectado] = useState(false);
  const [membros, setMembros] = useState<MembroRoda[]>([]);
  const refs = useRef({ aoEstado, aoDupla, recarregar });

  useEffect(() => {
    refs.current = { aoEstado, aoDupla, recarregar };
  });

  useEffect(() => {
    if (rodaId === null) return;

    const echo = perfil === "crianca" ? getEchoCrianca() : getEcho();
    const nome = `roda.${rodaId}`;

    if (!echo) {
      const intervalo = setInterval(() => void refs.current.recarregar(), 5000);

      return () => clearInterval(intervalo);
    }

    echo
      .join(nome)
      .here((lista: MembroRoda[]) => setMembros(lista))
      .joining((m: MembroRoda) => setMembros((atual) => [...atual.filter((x) => x.id !== m.id), m]))
      .leaving((m: MembroRoda) => setMembros((atual) => atual.filter((x) => x.id !== m.id)))
      .listen(".roda.atualizada", (e: RodaEstado) => refs.current.aoEstado(e))
      .listen(".dupla.atualizada", (e: DuplaEstado) => refs.current.aoDupla?.(e));

    const conexao = echo.connector.pusher.connection;
    const aoConectar = () => {
      setConectado(true);
      void refs.current.recarregar();
    };
    const aoCair = () => setConectado(false);

    conexao.bind("connected", aoConectar);
    conexao.bind("disconnected", aoCair);
    conexao.bind("unavailable", aoCair);
    conexao.bind("failed", aoCair);

    const inicial = setTimeout(() => setConectado(conexao.state === "connected"), 0);

    // Reserva: enquanto desconectado, busca o snapshot a cada 5 s.
    const polling = setInterval(() => {
      if (conexao.state !== "connected") void refs.current.recarregar();
    }, 5000);

    return () => {
      clearTimeout(inicial);
      clearInterval(polling);
      conexao.unbind("connected", aoConectar);
      conexao.unbind("disconnected", aoCair);
      conexao.unbind("unavailable", aoCair);
      conexao.unbind("failed", aoCair);
      echo.leave(nome);
      setMembros([]);
    };
  }, [rodaId, perfil]);

  return { conectado, membros };
}
