"use client";

import { Check, Eraser, Volume2 } from "lucide-react";
import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Peca } from "@/components/crianca/ui/peca";
import { adicionar, BANDEJA_VAZIA, limpar, remover, type Bandeja } from "@/lib/aula/bandeja";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeDitado } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "ouça a palavra e monte com as peças. depois toque em conferir.";

/**
 * DITADO (ouvir → montar): a criança ouve a palavra (gravação ou voz do
 * navegador) e monta com peças de sílaba numa bandeja do tamanho certo.
 * Erro dá a dica e deixa a bandeja para ajustar; 2º erro mostra a palavra.
 */
export function Ditado({ aula, atividade, minusculas, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeDitado>) {
  const [indice, setIndice] = useState(0);
  const [bandejas, setBandejas] = useState<Record<string, Bandeja>>({});
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { silabas?: string[]; palavra?: string } | null;

      return r?.silabas ? `a palavra é ${r.palavra?.toLocaleLowerCase("pt-BR")}: ${r.silabas.map((s) => s.toLocaleLowerCase("pt-BR")).join(", ")}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };
  const falaDaPalavra = item ? { texto: item.fala, audio_url: item.audio_url } : null;

  useNarracaoDeChegada(
    `ditado-${item?.id ?? indice}`,
    falaDaPalavra ? [instrucao, { texto: "a palavra é:" }, falaDaPalavra] : [instrucao],
    instrucao,
    definirInstrucao,
  );

  if (!item) {
    return (
      <section aria-label="Ditado" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const certas = (estado?.respostaCorreta as { silabas?: string[] } | null)?.silabas ?? null;
  const bandeja = resolvido && certas ? certas : (bandejas[item.id] ?? BANDEJA_VAZIA);
  const completa = bandeja.length >= item.tamanho;

  const ouvir = () => {
    sons.toque();
    if (falaDaPalavra) void narrar(falaDaPalavra);
  };

  const por = (silaba: string) => {
    sons.toque();
    void narrar(silaba);
    setBandejas((atual) => ({ ...atual, [item.id]: adicionar(atual[item.id] ?? BANDEJA_VAZIA, silaba, item.tamanho) }));
  };

  const tirar = (i: number) => {
    sons.toque();
    setBandejas((atual) => ({ ...atual, [item.id]: remover(atual[item.id] ?? BANDEJA_VAZIA, i) }));
  };

  const apagar = () => {
    sons.toque();
    setBandejas((atual) => ({ ...atual, [item.id]: limpar() }));
  };

  const conferir = () => {
    if (bandeja.length === 0) {
      sons.dica();
      void narrar("toque nas peças para montar a palavra.");

      return;
    }

    void responder(item.id, { silabas: [...bandeja] }, { silabas: [...bandeja] });
  };

  return (
    <section aria-label="Ditado" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5">
        <BotaoGrande rotulo="Ouvir a palavra" cor="primaria" redondo={false} tamanho={96} className="px-8" onClick={ouvir}>
          <Volume2 className="size-12" aria-hidden />
        </BotaoGrande>

        <div
          role="group"
          aria-label="Bandeja"
          className={cn(
            "flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-[2rem] border-4 border-dashed p-2 sm:gap-3 sm:p-3",
            estado?.correta ? "border-[var(--c-sucesso)] bg-[var(--c-superficie)]" : "border-[var(--c-borda)] bg-[var(--c-superficie)]",
          )}
        >
          {Array.from({ length: item.tamanho }, (_, i) => {
            const silaba = bandeja[i];

            return silaba ? (
              <Peca
                key={`${i}-${silaba}`}
                texto={silaba}
                minusculas={minusculas}
                tamanho="lg"
                rotulo={`Tirar ${silaba}`}
                disabled={resolvido}
                onClick={() => tirar(i)}
                className="animate-crianca-entrar"
              />
            ) : (
              <div key={`vazio-${i}`} aria-hidden className="size-20 rounded-3xl border-2 border-dashed border-white/15 bg-white/5" />
            );
          })}
        </div>

        <ul aria-label="Peças" className="flex flex-wrap justify-center gap-3">
          {item.opcoes.map((silaba) => (
            <li key={silaba}>
              <Peca
                texto={silaba}
                minusculas={minusculas}
                tamanho="lg"
                rotulo={`Sílaba ${silaba}`}
                disabled={resolvido || enviando || completa}
                data-opcao={silaba}
                onClick={() => por(silaba)}
              />
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-4">
          <BotaoGrande rotulo="Apagar" cor="neutra" tamanho={72} disabled={resolvido || bandeja.length === 0} onClick={apagar}>
            <Eraser className="size-9" strokeWidth={2.5} aria-hidden />
          </BotaoGrande>
          <BotaoGrande
            rotulo="Conferir"
            cor="sucesso"
            tamanho={88}
            disabled={resolvido || enviando || !completa}
            destaque={completa && !resolvido}
            aria-busy={enviando || undefined}
            onClick={conferir}
          >
            <Check className="size-11" strokeWidth={3.5} aria-hidden />
          </BotaoGrande>
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
