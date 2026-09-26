"use client";

import { useState } from "react";

import { narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { classeDaOpcao, Enunciado, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { Peca } from "@/components/crianca/ui/peca";
import { exibirPalavra } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { AtividadeEscolherSilaba, ItemSilaba } from "@/types/CriancaApp";

function enunciado(item: ItemSilaba): string {
  return item.modo === "trocar" && item.palavra && item.alvo
    ? `troque uma sílaba de ${item.palavra} para formar ${item.alvo}.`
    : "qual sílaba falta?";
}

/**
 * ESCOLHER SÍLABA (EF02LP02): completar a sílaba que falta ou trocar uma
 * sílaba para virar outra palavra. As peças da palavra ficam na tela, com um
 * buraco; as opções são peças de sílaba.
 */
export function EscolherSilaba({ aula, atividade, minusculas, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeEscolherSilaba>) {
  const [indice, setIndice] = useState(0);
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { silaba?: string; palavra?: string } | null;

      return r?.silaba ? `a sílaba é ${r.silaba}${r.palavra ? `: ${r.palavra}` : ""}.` : null;
    },
  });
  const instrucao = { texto: atividade.instrucao ?? "toque na sílaba certa." };

  useNarracaoDeChegada(`silaba-${item?.id ?? indice}`, item ? [{ texto: enunciado(item) }] : [instrucao], instrucao, definirInstrucao);

  if (!item) {
    return (
      <section aria-label="Escolher sílaba" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const certa = (estado?.respostaCorreta as { silaba?: string } | null)?.silaba ?? (estado?.correta ? (estado.ultima as { silaba?: string })?.silaba : null);
  const ultima = (estado?.ultima as { silaba?: string } | undefined)?.silaba;
  const preenchida = resolvido ? certa : ultima && estado && !estado.correta ? null : ultima;

  const aparencia = (silaba: string) => {
    if (!estado) return "neutra" as const;
    if (silaba === certa) return "certa" as const;
    if (silaba === ultima && !estado.correta) return "nao" as const;

    return resolvido ? ("apagada" as const) : ("neutra" as const);
  };

  return (
    <section aria-label="Escolher sílaba" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5">
        <Enunciado texto={enunciado(item)} />

        <div role="group" aria-label="Palavra" className="flex flex-wrap items-center justify-center gap-2">
          {item.pecas.map((peca, i) =>
            peca !== null ? (
              <Peca
                key={i}
                texto={peca}
                minusculas={minusculas}
                tamanho="xl"
                onClick={() => {
                  sons.toque();
                  void narrar(peca);
                }}
              />
            ) : (
              <div
                key={i}
                aria-label={preenchida ? `sílaba ${preenchida}` : "sílaba que falta"}
                role="img"
                className={cn(
                  "flex min-h-28 min-w-28 items-center justify-center rounded-[2rem] border-4 border-dashed border-[var(--c-portugues)] bg-[var(--c-superficie)] px-5 text-6xl font-black",
                  preenchida ? "border-solid text-[var(--c-portugues)]" : "text-white/20",
                )}
              >
                {preenchida ? exibirPalavra(preenchida, minusculas) : "?"}
              </div>
            ),
          )}
        </div>

        <ul aria-label="Opções de sílaba" className="flex flex-wrap justify-center gap-3">
          {item.opcoes.map((silaba) => (
            <li key={silaba}>
              <Peca
                texto={silaba}
                minusculas={minusculas}
                tamanho="lg"
                rotulo={`Sílaba ${silaba}`}
                disabled={resolvido || enviando}
                data-opcao={silaba}
                className={classeDaOpcao(aparencia(silaba))}
                onClick={() => void responder(item.id, { silaba }, { silaba })}
              />
            </li>
          ))}
        </ul>

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
