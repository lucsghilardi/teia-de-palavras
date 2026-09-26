"use client";

import { ArrowLeft, Network, RefreshCw, Rocket, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { calcularLayoutTeia, tamanhoFonte } from "@/components/crianca/teia/layout-teia";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { corDaPeca } from "@/components/crianca/ui/peca";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { COPY } from "@/lib/copy";
import { exibirPalavra } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import { UnauthorizedError } from "@/services/apiError";
import { buscarTeia } from "@/services/crianca";
import type { PalavraTeia, Teia } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; teia: Teia };

/** Quantas das mais recentes ganham o brilho de "nova". */
const QUANTAS_NOVAS = 3;
const FALA_VAZIA = "Sua teia ainda está vazia. Vamos descobrir palavras!";

function textoTotal(total: number) {
  return total === 1 ? "1 palavra" : `${total} palavras`;
}

function DesenhoTeia({ largura, altura, fios, aneis }: { largura: number; altura: number; fios: string[]; aneis: string[] }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none" stroke="var(--c-portugues)" strokeLinecap="round" strokeLinejoin="round">
        {fios.map((d, i) => (
          <path key={`f${i}`} d={d} strokeWidth={2} />
        ))}
        {aneis.map((d, i) => (
          <path key={`a${i}`} d={d} strokeWidth={i === aneis.length - 1 ? 2.5 : 1.75} opacity={0.9 - i * 0.04} />
        ))}
      </g>
    </svg>
  );
}

function FichaPalavra({
  item,
  minusculas,
  nova,
  larguraCelula,
  x,
  y,
  indice,
}: {
  item: PalavraTeia;
  minusculas: boolean;
  nova: boolean;
  larguraCelula: number;
  x: number;
  y: number;
  indice: number;
}) {
  return (
    <li
      className="absolute -translate-x-1/2 -translate-y-1/2 animate-crianca-entrar"
      style={{ left: x, top: y, animationDelay: `${Math.min(indice, 20) * 30}ms` }}
    >
      <button
        type="button"
        aria-label={`Palavra ${item.palavra.toLocaleUpperCase("pt-BR")}`}
        onClick={() => {
          sons.toque();
          void falar(item.palavra, item.audio_url);
        }}
        style={{ maxWidth: larguraCelula - 6, fontSize: tamanhoFonte(item.palavra, larguraCelula) }}
        className={cn(
          "relative flex min-h-16 min-w-16 select-none flex-col items-center justify-center gap-1 rounded-2xl px-2.5 py-1.5 font-black tracking-wide",
          "transition-transform duration-100 active:translate-y-1 active:shadow-none",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)] touch-manipulation",
          corDaPeca(item.palavra),
          nova && "ring-4 ring-[var(--c-tinta)] shadow-[0_0_20px_6px_rgba(250,204,21,0.7)]",
        )}
      >
        {item.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- host da mídia muda por ambiente
          <img
            src={item.imagem_url}
            alt=""
            aria-hidden
            draggable={false}
            loading="lazy"
            decoding="async"
            className="size-9 rounded-lg bg-[var(--c-superficie)]/70 object-contain"
          />
        ) : null}
        <span className="whitespace-nowrap leading-none">{exibirPalavra(item.palavra, minusculas)}</span>
        {nova ? <Sparkles aria-hidden className="absolute -top-3 -right-3 size-6 fill-[var(--c-alerta)] text-[var(--c-alerta)]" /> : null}
      </button>
    </li>
  );
}

/** A Teia de Palavras da criança: cada palavra descoberta vira uma ficha na teia. */
export function TeiaDePalavras() {
  const router = useRouter();
  const { crianca, atualizar } = useCrianca();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    let ativo = true;

    buscarTeia()
      .then((teia) => {
        if (!ativo) return;

        setEstado({ tipo: "pronto", teia });
        atualizar({ teia_total: teia.total });
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
  }, [tentativa, router, atualizar]);

  // Mede a área da teia (o desenho e as posições dependem da largura real).
  const medirArea = useCallback((elemento: HTMLDivElement | null) => {
    if (!elemento) return;

    const observador = new ResizeObserver(([entrada]) => {
      setLargura(Math.round(entrada.contentRect.width));
    });
    observador.observe(elemento);

    return () => observador.disconnect();
  }, []);

  const minusculas = crianca?.usa_minusculas ?? true;
  const palavras = useMemo(() => (estado.tipo === "pronto" ? estado.teia.palavras : []), [estado]);
  const total = estado.tipo === "pronto" ? estado.teia.total : (crianca?.teia_total ?? 0);
  const comImagem = palavras.some((p) => p.imagem_url);

  const layout = useMemo(
    () => (largura > 0 ? calcularLayoutTeia(largura, palavras.length, comImagem) : null),
    [largura, palavras.length, comImagem],
  );

  let instrucao: string | null = null;

  if (estado.tipo === "erro") {
    instrucao = "Não consegui abrir a sua teia. Toque no botão para tentar de novo.";
  } else if (estado.tipo === "pronto") {
    instrucao =
      palavras.length === 0
        ? FALA_VAZIA
        : `Esta é a sua Teia de Palavras! Você já descobriu ${textoTotal(total)}. Toque numa palavra para ouvir.`;
  }

  useFalarAoChegar(instrucao);

  const vazia = estado.tipo === "pronto" && palavras.length === 0;

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao ?? "Esta é a sua Teia de Palavras!"}>
        <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={72} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <Network aria-hidden className="size-8 text-[var(--c-portugues)]" strokeWidth={2.5} />
          Minha Teia
        </h1>
      </BarraTopo>

      <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-2 pb-8 sm:px-6">
        {estado.tipo === "erro" ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6">
            <Network aria-hidden className="size-24 text-[var(--c-borda)]" />
            <BotaoGrande
              rotulo="Tentar de novo"
              cor="primaria"
              tamanho={96}
              onClick={() => {
                setEstado({ tipo: "carregando" });
                setTentativa((n) => n + 1);
              }}
            >
              <RefreshCw className="size-12" aria-hidden />
            </BotaoGrande>
          </div>
        ) : (
          <div
            ref={medirArea}
            className="relative mx-auto w-full max-w-4xl overflow-hidden"
            style={{ height: layout?.altura ?? 360 }}
          >
            {layout ? (
              <>
                <DesenhoTeia largura={layout.largura} altura={layout.altura} fios={layout.fios} aneis={layout.aneis} />

                <div
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: layout.centro.x, top: layout.centro.y }}
                >
                  <BotaoGrande
                    rotulo={`${textoTotal(total)} na teia`}
                    falaAoTocar={total === 0 ? FALA_VAZIA : `Você já descobriu ${textoTotal(total)}!`}
                    cor="neutra"
                    tamanho={80}
                    disabled={estado.tipo === "carregando"}
                    className={cn(
                      "size-20 flex-col gap-0 border-4 border-[var(--c-portugues)] px-0 text-xl tabular-nums leading-none disabled:opacity-100",
                      estado.tipo === "carregando" && "animate-crianca-pulso",
                    )}
                  >
                    <Network aria-hidden className="size-7 text-[var(--c-portugues)]" strokeWidth={2.5} />
                    {estado.tipo === "pronto" ? <span aria-hidden>{total}</span> : null}
                  </BotaoGrande>
                </div>

                {palavras.length > 0 ? (
                  <ul aria-label="Palavras da teia" className="absolute inset-0">
                    {palavras.map((item, indice) => {
                      const posicao = layout.fichas[indice];

                      if (!posicao) return null;

                      return (
                        <FichaPalavra
                          key={`${item.palavra}-${indice}`}
                          item={item}
                          minusculas={minusculas}
                          nova={indice < QUANTAS_NOVAS}
                          larguraCelula={layout.larguraCelula}
                          x={posicao.x}
                          y={posicao.y}
                          indice={indice}
                        />
                      );
                    })}
                  </ul>
                ) : null}
              </>
            ) : null}
          </div>
        )}

        {vazia ? (
          <BotaoGrande
            rotulo="Ir para o planeta Português"
            falaAoTocar="Vamos descobrir palavras!"
            cor="sucesso"
            redondo={false}
            tamanho={88}
            destaque
            className="px-8"
            onClick={() => router.push("/app/planeta/portugues")}
          >
            <Rocket className="size-10" aria-hidden />
          </BotaoGrande>
        ) : null}
      </div>
    </main>
  );
}
