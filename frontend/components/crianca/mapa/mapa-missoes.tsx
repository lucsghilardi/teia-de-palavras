"use client";

import { RefreshCw, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { VisualOpcao } from "@/components/crianca/comum/visual-opcao";
import { NoMissao } from "@/components/crianca/mapa/no-missao";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { UnauthorizedError } from "@/services/apiError";
import { buscarMapa } from "@/services/crianca";
import type { Missao } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; missoes: Missao[] };

const FALA_TRANCADA = "Essa missão ainda está trancada. Termine a anterior!";

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
        <path d={caminho} fill="none" stroke="#F3DDB0" strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d={caminho}
          fill="none"
          stroke="white"
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
        className="absolute -translate-x-1/2 -translate-y-1/2 text-6xl"
        style={{ left: `${posicaoX(pontos - 1)}%`, top: posicaoY(pontos - 1) }}
      >
        🏆
      </span>
    </div>
  );
}

/**
 * O mapa de missões: cabeçalho com a criança, estrelas e a Teia; embaixo, a
 * trilha sinuosa com as missões na ordem.
 */
export function MapaMissoes() {
  const router = useRouter();
  const { crianca, recarregar, sair } = useCrianca();
  const movimentoReduzido = useMovimentoReduzido();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    buscarMapa()
      .then(({ missoes }) => {
        if (!ativo) return;

        setEstado({ tipo: "pronto", missoes: [...missoes].sort((a, b) => a.ordem - b.ordem) });
        // Voltando de uma missão: estrelas e Teia podem ter mudado.
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
  }, [tentativa, router, recarregar]);

  const minusculas = crianca?.usa_minusculas ?? false;
  const missoes = estado.tipo === "pronto" ? estado.missoes : [];
  const atual =
    missoes.find((m) => m.status === "em_andamento") ?? missoes.find((m) => m.status === "disponivel") ?? null;

  let instrucao: string | null = null;

  if (crianca && estado.tipo !== "carregando") {
    const oi = `Oi, ${crianca.apelido}!`;

    if (estado.tipo === "erro") {
      instrucao = `${oi} Não consegui abrir o mapa. Toque no botão para tentar de novo.`;
    } else if (missoes.length === 0) {
      instrucao = `${oi} Ainda não tem missão por aqui. Volte logo!`;
    } else {
      instrucao = `${oi} Escolha a sua missão.`;
    }
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
      void falar(FALA_TRANCADA);

      return;
    }

    router.push(`/app/missao/${missao.id}`);
  }

  const estrelas = crianca?.estrelas ?? 0;
  const rotuloEstrelas = estrelas === 1 ? "1 estrela" : `${estrelas} estrelas`;

  return (
    <main className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#E8F6FF_0%,var(--c-fundo)_45%,#EAF8E6_100%)]">
      <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[color-mix(in_srgb,#E8F6FF_88%,transparent)] px-4 pt-4 pb-3 backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6">
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white shadow-[0_4px_0_var(--c-borda)]">
            <VisualOpcao opcao={crianca?.avatar} className="size-12 text-5xl" />
          </span>
          <h1 className="truncate text-2xl font-black tracking-wide sm:text-3xl">
            {crianca ? exibir(crianca.apelido, minusculas) : " "}
          </h1>
        </div>

        <div className="col-span-2 row-start-2 flex items-center gap-3 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <BotaoGrande
            rotulo={rotuloEstrelas}
            falaAoTocar={`Você tem ${rotuloEstrelas}!`}
            cor="branco"
            redondo={false}
            tamanho={64}
            className="px-4 text-3xl tabular-nums"
          >
            <span aria-hidden>⭐</span>
            {estrelas}
          </BotaoGrande>

          <BotaoGrande
            rotulo="Minha Teia de Palavras"
            cor="teia"
            redondo={false}
            tamanho={64}
            className="px-4 text-3xl tabular-nums"
            onClick={() => router.push("/app/teia")}
          >
            <span aria-hidden>🕸️</span>
            {crianca ? <span aria-hidden>{crianca.teia_total}</span> : null}
          </BotaoGrande>
        </div>

        <BotaoOuvir
          texto={instrucao ?? "Escolha a sua missão."}
          className="col-start-2 row-start-1 sm:col-start-3"
        />
      </header>

      <div className="flex-1 px-4 pt-4 pb-6 sm:px-6">
        {estado.tipo === "carregando" ? (
          <div role="status" aria-label="Carregando o mapa" className="flex min-h-[50dvh] items-center justify-center">
            <span aria-hidden className="animate-crianca-pulso text-7xl">
              🗺️
            </span>
          </div>
        ) : null}

        {estado.tipo === "erro" ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6 text-center">
            <span aria-hidden className="text-8xl">
              🗺️
            </span>
            <BotaoGrande
              rotulo="Tentar de novo"
              cor="ceu"
              tamanho={96}
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
            <span aria-hidden className="text-8xl">
              🚧
            </span>
            <p className="text-2xl font-black">{exibir("Volte logo!", minusculas)}</p>
          </div>
        ) : null}

        {estado.tipo === "pronto" && missoes.length > 0 ? (
          <Trilha missoes={missoes} minusculas={minusculas} idAtual={idAtual} onTocar={tocarMissao} />
        ) : null}
      </div>

      {/* Para adultos: discreto, no rodapé. */}
      <footer className="flex justify-center px-4 pb-4">
        <button
          type="button"
          aria-label="Trocar de criança"
          onClick={() => void sair()}
          className="inline-flex min-h-16 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[color-mix(in_srgb,var(--c-tinta)_55%,transparent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
        >
          <Repeat className="size-4" aria-hidden />
          trocar de criança
        </button>
      </footer>
    </main>
  );
}
