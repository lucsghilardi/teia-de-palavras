"use client";

import { useState } from "react";

import { useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { classeDaOpcao, Enunciado, RodapeItens } from "@/components/crianca/atividades/genericas/comuns";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { useResposta } from "@/components/crianca/atividades/use-resposta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { falaDaPergunta } from "@/lib/atividades/falas";
import { cn } from "@/lib/utils";
import type { AtividadeEscolha } from "@/types/CriancaApp";

const INSTRUCAO_PADRAO = "toque na resposta.";

/**
 * ESCOLHA (e verdadeiro/falso): uma pergunta por vez com opções grandes.
 * Acerto marca a opção; erro dá dica; no 2º erro a certa acende e a criança segue.
 *
 * 1º ano: a criança ainda está aprendendo a ler, então a chegada lê a pergunta
 * e cada opção (a opção lida acende) e o alto-falante repete pergunta + opções.
 */
export function Escolha({ aula, atividade, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeEscolha>) {
  const [indice, setIndice] = useState(0);
  const item = atividade.itens[Math.min(indice, atividade.itens.length - 1)];
  const { responder, estadoDe, enviando } = useResposta({
    aula,
    atividade,
    mostrarConquistas,
    descreverResposta: (rc) => {
      const r = rc as { texto?: string; explicacao?: string | null } | null;

      return r?.texto ? `a resposta é ${r.texto}.${r.explicacao ? ` ${r.explicacao}` : ""}` : null;
    },
  });
  const [lendo, setLendo] = useState<number | null>(null);
  const instrucao = { texto: atividade.instrucao ?? INSTRUCAO_PADRAO };
  const textosOpcoes = item ? item.opcoes.map((o) => o.texto) : [];
  const falaDoTopo = item ? { texto: falaDaPergunta(item.pergunta, textosOpcoes) } : instrucao;
  const falas = item ? [{ texto: item.pergunta }, ...textosOpcoes.map((texto) => ({ texto })), instrucao] : [instrucao];

  // Trecho 0 é a pergunta; de 1 a N, as opções (acende a que está sendo lida).
  const narrada = useNarracaoDeChegada(`escolha-${item?.id ?? indice}`, falas, falaDoTopo, definirInstrucao, (i) =>
    setLendo(i >= 1 && i <= textosOpcoes.length ? i - 1 : null),
  );
  const opcaoLida = narrada ? null : lendo;

  if (!item) {
    return (
      <section aria-label="Escolha" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
        <RodapeItens total={1} atual={0} resolvido aoProximo={aoConcluir} aoConcluir={aoConcluir} />
      </section>
    );
  }

  const estado = estadoDe(item.id);
  const resolvido = estado?.resolvido ?? false;
  const idCerta = (estado?.respostaCorreta as { opcao?: string } | null)?.opcao ?? null;
  const ultima = (estado?.ultima as { opcao?: string } | undefined)?.opcao ?? null;
  const acertouCom = estado?.correta ? ultima : null;

  const aparencia = (id: string) => {
    if (!estado) return "neutra" as const;
    if (id === acertouCom || id === idCerta) return "certa" as const;
    if (id === ultima && !estado.correta) return "nao" as const;

    return resolvido ? ("apagada" as const) : ("neutra" as const);
  };

  return (
    <section aria-label="Escolha" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      <div key={item.id} className="animate-crianca-entrar flex flex-1 flex-col items-center justify-center gap-5">
        <Enunciado texto={item.pergunta} icone={item.icone} />

        <ul aria-label="Opções" className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {item.opcoes.map((opcao, i) => (
            <li key={opcao.id} className="flex">
              <BotaoGrande
                rotulo={opcao.texto}
                cor="neutra"
                redondo={false}
                tamanho={72}
                disabled={resolvido || enviando}
                data-opcao={opcao.id}
                className={cn(
                  "w-full justify-start px-5 text-left text-2xl",
                  classeDaOpcao(aparencia(opcao.id)),
                  opcaoLida === i && !estado && "ring-4 ring-[var(--c-teia)]",
                )}
                onClick={() => void responder(item.id, { opcao: opcao.id }, { opcao: opcao.id })}
              >
                {opcao.texto}
              </BotaoGrande>
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
