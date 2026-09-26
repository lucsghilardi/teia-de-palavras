"use client";

import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { classeDaOpcao, Enunciado, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeMapaPontos } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "toque no lugar que a pergunta pede.";
const CENARIOS = ["bairro", "escola"];

/**
 * MAPA COM PONTOS (Geografia): um cenário visto de cima com lugares
 * marcados. A criança toca no lugar pedido; tocar num ponto fala o nome dele
 * (a resposta nunca está na tela). 2º erro acende o ponto certo.
 */
export function MapaPontos({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeMapaPontos>) {
  const [indice, setIndice] = useState(0);
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { rotulo?: string } | null;

      return r?.rotulo ? `é aqui: ${r.rotulo}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };
  const cenario = CENARIOS.includes(atividade.cenario) ? atividade.cenario : "bairro";

  useNarracaoDeChegada(`mapa-${item?.id ?? indice}`, item ? [{ texto: item.texto }, instrucao] : [instrucao], instrucao, definirInstrucao);

  if (!item) {
    return (
      <section aria-label="Mapa" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const certo = (estado?.respostaCorreta as { ponto?: string } | null)?.ponto ?? (estado?.correta ? (estado.ultima as { ponto?: string })?.ponto : null);
  const ultimo = (estado?.ultima as { ponto?: string } | undefined)?.ponto;

  const aparencia = (chave: string) => {
    if (!estado) return "neutra" as const;
    if (chave === certo) return "certa" as const;
    if (chave === ultimo && !estado.correta) return "nao" as const;

    return resolvido ? ("apagada" as const) : ("neutra" as const);
  };

  return (
    <section aria-label="Mapa" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-4">
        <Enunciado texto={item.texto} icone="map" />

        <div
          role="group"
          aria-label={`mapa: ${cenario}`}
          className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] ring-4 ring-[var(--c-borda)]"
          style={{ aspectRatio: "4 / 3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- desenho estático do app */}
          <img src={`/cenarios/${cenario}.svg`} alt="" aria-hidden draggable={false} className="absolute inset-0 size-full object-cover" />

          {atividade.pontos.map((ponto) => (
            <BotaoGrande
              key={ponto.chave}
              rotulo={ponto.rotulo}
              cor="neutra"
              tamanho={64}
              disabled={enviando}
              data-ponto={ponto.chave}
              className={cn(
                "absolute size-16 -translate-x-1/2 -translate-y-1/2 border-4 border-[var(--c-fundo)] px-0",
                classeDaOpcao(aparencia(ponto.chave)),
              )}
              style={{ left: `${ponto.x * 100}%`, top: `${ponto.y * 100}%` }}
              onClick={() => {
                if (resolvido) {
                  sons.toque();
                  void narrar(ponto.rotulo);

                  return;
                }

                void responder(item.id, { ponto: ponto.chave }, { ponto: ponto.chave });
              }}
            >
              <Icone nome={ponto.icone ?? "map-pin"} className="size-8" strokeWidth={2.25} aria-hidden />
            </BotaoGrande>
          ))}
        </div>

        {estado && !estado.correta && estado.dica ? (
          <p role="status" className="max-w-2xl text-center text-xl font-bold text-[var(--c-tinta)]/80">
            {estado.dica}
          </p>
        ) : null}
      </div>

      <RodapeItens
        total={atividade.itens.length}
        atual={indice}
        resolvido={resolvido}
        aoProximo={() => setIndice((i) => Math.min(atividade.itens.length - 1, i + 1))}
        aoConcluir={aoConcluir}
      />
    </section>
  );
}
