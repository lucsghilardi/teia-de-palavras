"use client";

import { ArrowLeft, Mic, Network, Rocket, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { celebrar } from "@/components/crianca/aula/celebrar";
import { falasDeConquistas, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import type { PropsConquista } from "@/components/crianca/atividades/tipos";
import { MascoteSolo } from "@/components/crianca/ilustracoes/personagens";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { COPY } from "@/lib/copy";
import { exibir, exibirPalavra } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import type { ResultadoConclusao } from "@/types/CriancaApp";

const FALA_FINAL = { texto: COPY.missao.concluida };

/**
 * CONQUISTA (etapa N+1): conclui a missão no servidor (uma vez), comemora com o
 * mascote e mostra os pontos, as palavras descobertas nesta missão e as
 * medalhas. O fecho do episódio (desfecho) é falado logo depois de "Missão
 * concluída!" e o gancho do próximo episódio aparece num cartão. A missão
 * pode ser revista depois — nada aqui trava.
 */
export function TelaConquista({
  aula,
  minusculas,
  definirInstrucao,
  mostrarConquistas,
  concluirMissao,
  xpNoInicio,
}: PropsConquista) {
  const router = useRouter();
  const reduzido = useMovimentoReduzido();
  const { crianca } = useCrianca();
  const [xpAntes] = useState(() => xpNoInicio ?? crianca?.xp ?? null);
  const [resultado, setResultado] = useState<ResultadoConclusao | null>(null);
  const [pronto, setPronto] = useState(false);
  const chamou = useRef(false);

  useEffect(() => {
    if (chamou.current) return;
    chamou.current = true;

    definirInstrucao(FALA_FINAL);
    celebrar(reduzido);
    const falaInicial = narrar(aula.desfecho ? [FALA_FINAL, { texto: aula.desfecho }] : FALA_FINAL);

    void concluirMissao().then(async (r) => {
      setResultado(r);
      setPronto(true);

      if (r && r.conquistas.length > 0) mostrarConquistas(r.conquistas);

      const extra: Trecho[] = [];
      const proxima = r?.desbloqueadas[0];

      if (aula.gancho) extra.push({ texto: aula.gancho });

      if (proxima) {
        extra.push({ texto: `Você desbloqueou a próxima missão: ${proxima.palavra_geradora ?? proxima.titulo}!` });
      }

      extra.push(...falasDeConquistas(r?.conquistas ?? []));

      // Só continua falando se a criança não tocou em nada durante "Missão concluída!".
      if (extra.length > 0 && (await falaInicial)) {
        definirInstrucao({ texto: [FALA_FINAL.texto, aula.desfecho, ...extra.map((t) => t.texto)].filter(Boolean).join(" ") });
        await narrar(extra);
      }
    });
    // Roda uma vez na chegada da etapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const palavras =
    resultado?.palavras_da_missao ??
    aula.atividades.flatMap((a) =>
      a.tipo === "montar_palavras"
        ? a.metas.filter((m) => m.encontrada).map((m) => ({ palavra: m.palavra, audio_url: m.audio_url }))
        : [],
    );
  const proxima = resultado?.desbloqueadas[0] ?? null;
  const ganhas = resultado && xpAntes !== null ? Math.max(0, resultado.xp_total - xpAntes) : null;
  const xpTotal = resultado?.xp_total ?? crianca?.xp ?? null;

  return (
    <section aria-label="Conquista" className="flex flex-1 flex-col items-center gap-5 px-3 pb-6 sm:px-6">
      <div className="animate-crianca-entrar flex flex-col items-center gap-2 pt-2">
        <MascoteSolo pose="comemorando" className="h-[clamp(6rem,20vmin,10rem)] w-auto" />
        <h2 className="text-center text-[clamp(2rem,6vw,3.5rem)] font-black leading-tight text-[var(--c-alerta)]">
          {exibir(COPY.missao.concluida, minusculas)}
        </h2>
      </div>

      <div
        role="img"
        aria-label={
          ganhas !== null && ganhas > 0
            ? `Você ganhou ${COPY.comum.pontos(ganhas)}`
            : xpTotal !== null
              ? COPY.comum.pontos(xpTotal)
              : "Pontos"
        }
        className="flex items-center gap-3 rounded-full bg-[var(--c-superficie)] px-6 py-3 text-4xl font-black shadow-[0_6px_0_var(--c-alerta-sombra)] ring-4 ring-[var(--c-alerta)]"
      >
        <Star aria-hidden className={cn("size-10 fill-[var(--c-alerta)] text-[var(--c-alerta)]", pronto && !reduzido && "animate-crianca-pulso")} />
        <span aria-hidden>{ganhas !== null && ganhas > 0 ? `+${ganhas}` : (xpTotal ?? "…")}</span>
      </div>

      {aula.gancho && (
        <button
          type="button"
          aria-label={`${COPY.missao.proximoEpisodio}: ${aula.gancho}`}
          onClick={() => {
            sons.toque();
            void narrar(aula.gancho ?? "");
          }}
          className="animate-crianca-entrar flex w-full max-w-2xl items-center gap-3 rounded-[2rem] bg-[var(--c-superficie)] px-5 py-3 text-left shadow-[0_6px_0_var(--c-teia-sombra)] ring-4 ring-[var(--c-teia)] touch-manipulation focus-visible:outline-none focus-visible:ring-[var(--c-foco)]"
        >
          <Sparkles aria-hidden className="size-10 shrink-0 text-[var(--c-teia)]" strokeWidth={2.25} />
          <span className="flex min-w-0 flex-col">
            <span className="text-base font-black tracking-wide text-[var(--c-teia)]">{exibir(COPY.missao.proximoEpisodio, minusculas)}</span>
            <span className="text-xl font-extrabold leading-snug">{exibir(aula.gancho, minusculas)}</span>
          </span>
        </button>
      )}

      {palavras.length > 0 && (
        <ul aria-label="Palavras que você descobriu nesta missão" className="flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-3">
          {palavras.map((p) => (
            <li key={p.palavra}>
              <button
                type="button"
                aria-label={`Palavra ${p.palavra}`}
                onClick={() => {
                  sons.toque();
                  void narrar({ texto: p.palavra, audio_url: p.audio_url });
                }}
                className="animate-crianca-entrar flex min-h-16 items-center gap-2 rounded-2xl bg-[var(--c-portugues)] px-4 text-3xl font-black text-[var(--c-fundo)] shadow-[0_5px_0_var(--c-teia-sombra)] touch-manipulation transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
              >
                <Network aria-hidden className="size-7" strokeWidth={2.5} />
                {exibirPalavra(p.palavra, minusculas)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {resultado && resultado.conquistas.length > 0 && (
        <ul aria-label="Medalhas novas" className="flex flex-wrap justify-center gap-3">
          {resultado.conquistas.map((c) => (
            <li key={c.chave}>
              <button
                type="button"
                aria-label={`Medalha ${c.titulo}`}
                onClick={() => {
                  sons.conquista();
                  void narrar(`${c.titulo}. ${c.descricao}`);
                }}
                className="animate-crianca-entrar flex min-h-20 items-center gap-3 rounded-3xl bg-[var(--c-superficie)] px-4 py-2 shadow-[0_5px_0_var(--c-alerta-sombra)] ring-4 ring-[var(--c-alerta)] touch-manipulation focus-visible:outline-none focus-visible:ring-[var(--c-foco)]"
              >
                <Icone nome={c.icone} aria-hidden className="size-12 text-[var(--c-alerta)]" strokeWidth={2.25} />
                <span className="text-xl font-black">{exibir(c.titulo, minusculas)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-center gap-4 pt-2">
        <BotaoGrande rotulo={COPY.missao.voltar} cor="neutra" tamanho={96} className="px-8" onClick={() => router.push(`/app/planeta/${aula.disciplina}`)}>
          <ArrowLeft className="size-12" aria-hidden />
        </BotaoGrande>
        {/* Aprender ensinando: a criança grava uma mini-aula sobre a missão que acabou de fazer. */}
        <BotaoGrande rotulo={COPY.amigos.darAula} cor="destaque" tamanho={96} className="px-8" onClick={() => router.push(`/app/amigos/nova?aula=${aula.id}`)}>
          <Mic className="size-12" aria-hidden />
        </BotaoGrande>
        {proxima && (
          <BotaoGrande
            rotulo={COPY.missao.proxima}
            cor="sucesso"
            tamanho={96}
            destaque
            className="animate-crianca-entrar px-8"
            onClick={() => router.push(`/app/missao/${proxima.id}`)}
          >
            <Rocket className="size-12" aria-hidden />
          </BotaoGrande>
        )}
      </div>
    </section>
  );
}
