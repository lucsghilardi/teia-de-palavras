"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoGravador = "parado" | "pedindo" | "gravando" | "pronto" | "sem_microfone";

export type Gravacao = { blob: Blob; url: string; tipo: string; duracaoMs: number };

/** Preferência: webm/opus (Chrome, Firefox, Edge) → mp4 (Safari/iOS) → ogg. */
const TIPOS = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function tipoSuportado(): string {
  if (typeof MediaRecorder === "undefined") return "";

  return TIPOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Extensão do arquivo enviado; o backend confere o conteúdo e serve pela extensão gravada. */
export function extensaoDoTipo(tipo: string): string {
  if (tipo.includes("mp4")) return "m4a";
  if (tipo.includes("ogg")) return "ogg";

  return "webm";
}

export function gravadorDisponivel(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Gravador de voz da criança (MediaRecorder): pede o microfone só ao tocar em
 * "gravar", para no tempo máximo, e devolve o blob com uma URL para pré-escuta.
 * Nunca guarda áudio no navegador além da gravação atual.
 */
export function useGravador(maxSegundos = 30) {
  const [estado, setEstado] = useState<EstadoGravador>("parado");
  const [segundos, setSegundos] = useState(0);
  const [gravacao, setGravacao] = useState<Gravacao | null>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const inicio = useRef(0);
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null);

  const limparRelogio = useCallback(() => {
    if (relogio.current) clearInterval(relogio.current);
    relogio.current = null;
  }, []);

  const soltarMicrofone = useCallback(() => {
    fluxo.current?.getTracks().forEach((t) => t.stop());
    fluxo.current = null;
  }, []);

  const descartar = useCallback(() => {
    setGravacao((atual) => {
      if (atual) URL.revokeObjectURL(atual.url);

      return null;
    });
    setSegundos(0);
    setEstado("parado");
  }, []);

  const parar = useCallback(() => {
    const r = gravador.current;

    if (r && r.state !== "inactive") r.stop();
  }, []);

  const iniciar = useCallback(async () => {
    if (!gravadorDisponivel()) {
      setEstado("sem_microfone");

      return;
    }

    descartar();
    setEstado("pedindo");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      fluxo.current = stream;
      const tipo = tipoSuportado();
      const r = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      pedacos.current = [];

      r.ondataavailable = (evento) => {
        if (evento.data.size > 0) pedacos.current.push(evento.data);
      };
      r.onstop = () => {
        const mime = r.mimeType || tipo || "audio/webm";
        const blob = new Blob(pedacos.current, { type: mime });
        const duracaoMs = Math.max(1, Date.now() - inicio.current);

        limparRelogio();
        soltarMicrofone();
        setGravacao({ blob, url: URL.createObjectURL(blob), tipo: mime, duracaoMs });
        setEstado("pronto");
      };

      gravador.current = r;
      inicio.current = Date.now();
      r.start(250);
      setSegundos(0);
      setEstado("gravando");
      relogio.current = setInterval(() => {
        const s = Math.floor((Date.now() - inicio.current) / 1000);
        setSegundos(s);

        if (s >= maxSegundos) parar();
      }, 250);
    } catch {
      soltarMicrofone();
      setEstado("sem_microfone");
    }
  }, [descartar, limparRelogio, maxSegundos, parar, soltarMicrofone]);

  // Sair da tela: para tudo e solta o microfone.
  useEffect(
    () => () => {
      limparRelogio();
      const r = gravador.current;

      if (r && r.state !== "inactive") r.stop();

      soltarMicrofone();
    },
    [limparRelogio, soltarMicrofone],
  );

  return { estado, segundos, gravacao, iniciar, parar, descartar, maxSegundos };
}
