"use client";

import { ArrowLeft, Flag, Mic, Network, RefreshCw, Telescope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { NoMissao } from "@/components/crianca/mapa/no-missao";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { Icone } from "@/components/crianca/ui/icone";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { COPY } from "@/lib/copy";
import { infoDisciplina } from "@/lib/disciplinas";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { UnauthorizedError } from "@/services/apiError";
import { buscarMapa } from "@/services/crianca";
import type { Disciplina, Missao } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; missoes: Missao[] };

/** Altura de cada "degrau" da trilha, em px. */
const DEGRAU = 184;
const MARGEM = 72;
/** Zigue-zague da trilha (posição horizontal de cada nó, em %). */
const ZIGUE = [50, 76, 50, 24];
const ID_ATUAL = "missao-atual";

function posicaoX(indice: number) {
  return ZIGUE[indice % ZIGUE.length];
}

function posicaoY(indice: number) {
  return MARGEM + indice * DEGRAU;
}

/** Caminho sinuoso ligando os nós (coordenadas: x em %, y em px). */
function caminhoDaTrilha(pontos: number) {
  let d = `M ${posicaoX(0)} ${posicaoY(0) - MARGEM + 8}`;

  for (let i = 0; i < pontos; i += 1) {
    const [xa, ya] = i === 0 ? [posicaoX(0), posicaoY(0) - MARGEM + 8] : [posicaoX(i - 1), posicaoY(i - 1)];
    const [xb, yb] = [posicaoX(i), posicaoY(i)];
    const meio = (yb - ya) / 2;
    d += ` C ${xa} ${ya + meio}, ${xb} ${yb - meio}, ${xb} ${yb}`;
  }

  return d;
}

function Trilha({
  missoes,
  minusculas,
  idAtual,
  onTocar,
}: {
  missoes: Missao[];
  minusculas: boolean;
  idAtual: number | null;
  onTocar: (missao: Missao) => void;
}) {
  // Um ponto a mais no fim: o troféu de chegada.
  const pontos = missoes.length + 1;
  const altura = posicaoY(pontos - 1) + MARGEM;
  const caminho = caminhoDaTrilha(pontos);

  return (
    <div className="relative mx-auto w-full max-w-lg" style={{ height: altura }}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 100 ${altura}`}
        preserveAspectRatio="none"
      >
        <path d={caminho} fill="none" stroke="var(--c-superficie-2)" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d={caminho}
          fill="none"
          stroke="var(--c-planeta)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="2 18"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ol aria-label="Missões" className="absolute inset-0">
        {missoes.map((missao, indice) => (
          <li
            key={missao.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-crianca-entrar"
            style={{ left: `${posicaoX(indice)}%`, top: posicaoY(indice), animationDelay: `${Math.min(indice, 10) * 50}ms` }}
          >
            <NoMissao
              id={missao.id === idAtual ? ID_ATUAL : undefined}
              missao={missao}
              minusculas={minusculas}
              onTocar={onTocar}
            />
          </li>
        ))}
      </ol>

      <span
        aria-hidden
        className="absolute flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--c-superficie)] ring-4 ring-[var(--c-planeta)]"
        style={{ left: `${posicaoX(pontos - 1)}%`, top: posicaoY(pontos - 1) }}
      >
        <Flag className="size-10 text-[var(--c-planeta)]" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/**
 * Um planeta: cabeçalho com a volta à Galáxia, o nome do planeta e (em
 * Português) a Teia; embaixo, a trilha sinuosa com as missões na ordem.
 */
export function MapaMissoes({ disciplina }: { disciplina: Disciplina }) {
  const router = useRouter();
  const { crianca, recarregar } = useCrianca();
  const movimentoReduzido = useMovimentoReduzido();
  const info = infoDisciplina(disciplina);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    buscarMapa(disciplina)
      .then(({ missoes }) => {
        if (!ativo) return;

        setEstado({ tipo: "pronto", missoes: [...missoes].sort((a, b) => a.fase - b.fase || a.ordem - b.ordem || a.id - b.id) });
        // Voltando de uma missão: XP e Teia podem ter mudado.
        void recarregar();
      })
      .catch((erro: unknown) => {
        if (!ativo) return;

        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        setEstado({ tipo: "erro" });
      });

    return () => {
      ativo = false;
    };
  }, [disciplina, tentativa, router, recarregar]);

  const minusculas = crianca?.usa_minusculas ?? true;
  const missoes = estado.tipo === "pronto" ? estado.missoes : [];
  const atual =
    missoes.find((m) => m.status === "em_andamento") ?? missoes.find((m) => m.status === "disponivel") ?? null;
  const ultimaConcluida = [...missoes].reverse().find((m) => m.status === "concluida") ?? null;

  let instrucao: string | null = null;

  if (estado.tipo === "erro") {
    instrucao = COPY.planeta.erro;
  } else if (estado.tipo === "pronto") {
    instrucao = missoes.length === 0 ? COPY.planeta.vazio : COPY.planeta.instrucao(info.nome);
  }

  useFalarAoChegar(instrucao);

  // Leva a trilha até a missão da vez (quando a lista é longa).
  const idAtual = atual?.id ?? null;
  useEffect(() => {
    if (idAtual === null) return;

    document.getElementById(ID_ATUAL)?.scrollIntoView({
      block: "center",
      behavior: movimentoReduzido ? "auto" : "smooth",
    });
  }, [idAtual, movimentoReduzido]);

  function tocarMissao(missao: Missao) {
    sons.toque();

    if (missao.status === "bloqueada") {
      void falar(COPY.planeta.trancada);

      return;
    }

    router.push(`/app/missao/${missao.id}`);
  }

  return (
    <main className="flex min-h-dvh flex-col" style={{ "--c-planeta": info.cor } as React.CSSProperties}>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[color-mix(in_srgb,var(--c-fundo)_85%,transparent)] px-4 pt-4 pb-3 backdrop-blur sm:px-6">
        <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={64} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>

        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]"
            style={{ backgroundColor: info.cor }}
          >
            <Icone nome={info.icone} className="size-8" strokeWidth={2.25} />
          </span>
          <h1 className="truncate text-2xl font-black sm:text-3xl">{exibir(info.nome, minusculas)}</h1>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {info.temPalavraGeradora ? (
            <BotaoGrande
              rotulo={COPY.planeta.teia}
              cor="destaque"
              redondo={false}
              tamanho={64}
              className="px-4 text-3xl tabular-nums"
              onClick={() => router.push("/app/teia")}
            >
              <Network className="size-8" aria-hidden strokeWidth={2.5} />
              {crianca ? <span aria-hidden>{crianca.teia_total}</span> : null}
            </BotaoGrande>
          ) : null}

          <BotaoOuvir texto={instrucao ?? COPY.planeta.instrucao(info.nome)} />
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-6 sm:px-6">
        {estado.tipo === "carregando" ? <TelaCarregando className="min-h-[50dvh]" /> : null}

        {estado.tipo === "erro" ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6 text-center">
            <Telescope aria-hidden className="size-24 text-[var(--c-borda)]" />
            <BotaoGrande
              rotulo={COPY.comum.tentarDeNovo}
              cor="primaria"
              tamanho={96}
              destaque
              onClick={() => {
                setEstado({ tipo: "carregando" });
                setTentativa((n) => n + 1);
              }}
            >
              <RefreshCw className="size-12" aria-hidden />
            </BotaoGrande>
          </div>
        ) : null}

        {estado.tipo === "pronto" && missoes.length === 0 ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
            <Telescope aria-hidden className="size-24 text-[var(--c-planeta)]" />
            <p className="text-2xl font-black">{exibir("Volte logo!", minusculas)}</p>
          </div>
        ) : null}

        {estado.tipo === "pronto" && missoes.length > 0 ? (
          <Trilha missoes={missoes} minusculas={minusculas} idAtual={idAtual} onTocar={tocarMissao} />
        ) : null}

        {/* Aprender ensinando: uma mini-aula sobre a última missão concluída deste planeta. */}
        {ultimaConcluida ? (
          <div className="mx-auto w-full max-w-lg pt-2">
            <BotaoGrande
              rotulo={COPY.amigos.darAulaSobre(ultimaConcluida.rotulo)}
              cor="destaque"
              redondo={false}
              tamanho={80}
              className="w-full justify-start gap-4 px-4 text-left"
              onClick={() => router.push(`/app/amigos/nova?aula=${ultimaConcluida.id}`)}
            >
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--c-fundo)]/15">
                <Mic className="size-8" strokeWidth={2.5} />
              </span>
              <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-xl font-extrabold sm:text-2xl">{exibir(COPY.amigos.darAula, minusculas)}</span>
                <span className="truncate text-base font-bold opacity-80">{exibir(`sobre ${ultimaConcluida.rotulo}`, minusculas)}</span>
              </span>
            </BotaoGrande>
          </div>
        ) : null}
      </div>
    </main>
  );
}
