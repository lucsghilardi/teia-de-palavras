"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { celebrar } from "@/components/crianca/aula/celebrar";
import { falasDeConquistas, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import type { PropsConquista } from "@/components/crianca/aula/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import type { ResultadoConclusao } from "@/types/CriancaApp";

const FALA_FINAL = { texto: "Missão concluída!" };

/**
 * Etapa 8 — CONQUISTA: conclui a aula no servidor (uma vez), comemora e mostra
 * estrelas, palavras descobertas nesta missão e medalhas. A aula pode ser
 * revista depois — nada aqui trava.
 */
export function EtapaConquista({
  aula,
  minusculas,
  definirInstrucao,
  mostrarConquistas,
  concluirMissao,
  estrelasNoInicio,
}: PropsConquista & { estrelasNoInicio: number | null }) {
  const router = useRouter();
  const reduzido = useMovimentoReduzido();
  const { crianca } = useCrianca();
  const [estrelasAntes] = useState(() => estrelasNoInicio ?? crianca?.estrelas ?? null);
  const [resultado, setResultado] = useState<ResultadoConclusao | null>(null);
  const [pronto, setPronto] = useState(false);
  const chamou = useRef(false);

  useEffect(() => {
    if (chamou.current) return;
    chamou.current = true;

    definirInstrucao(FALA_FINAL);
    celebrar(reduzido);
    const falaInicial = narrar(FALA_FINAL);

    void concluirMissao().then(async (r) => {
      setResultado(r);
      setPronto(true);

      if (r && r.conquistas.length > 0) mostrarConquistas(r.conquistas);

      const extra: Trecho[] = [];
      const proxima = r?.desbloqueadas[0];

      if (proxima) {
        extra.push({ texto: `Você desbloqueou a próxima missão: ${proxima.palavra_geradora}!` });
      }

      extra.push(...falasDeConquistas(r?.conquistas ?? []));

      // Só continua falando se a criança não tocou em nada durante "Missão concluída!".
      if (extra.length > 0 && (await falaInicial)) {
        definirInstrucao({ texto: [FALA_FINAL.texto, ...extra.map((t) => t.texto)].join(" ") });
        await narrar(extra);
      }
    });
    // Roda uma vez na chegada da etapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const palavras =
    resultado?.palavras_da_missao ??
    aula.metas.filter((m) => m.encontrada).map((m) => ({ palavra: m.palavra, audio_url: m.audio_url }));
  const proxima = resultado?.desbloqueadas[0] ?? null;
  const ganhas = resultado && estrelasAntes !== null ? Math.max(0, resultado.estrelas - estrelasAntes) : null;
  const estrelasTotal = resultado?.estrelas ?? crianca?.estrelas ?? null;

  return (
    <section aria-label="Conquista" className="flex flex-1 flex-col items-center gap-5 px-3 pb-6 sm:px-6">
      <div className="animate-crianca-entrar flex flex-col items-center gap-2 pt-2">
        <span aria-hidden className="text-[clamp(5rem,20vmin,10rem)] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.08)]">
          🏆
        </span>
        <h2 className="text-center text-[clamp(2rem,6vw,3.5rem)] font-black leading-tight text-[var(--c-teia)]">
          {exibir("Missão concluída!", minusculas)}
        </h2>
      </div>

      <div
        role="img"
        aria-label={
          ganhas !== null && ganhas > 0
            ? `Você ganhou ${ganhas} estrelas`
            : estrelasTotal !== null
              ? `${estrelasTotal} estrelas`
              : "Estrelas"
        }
        className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-4xl font-black shadow-[0_6px_0_var(--c-sol-sombra)] ring-4 ring-[var(--c-sol)]"
      >
        <span aria-hidden className={pronto && !reduzido ? "animate-crianca-pulso" : undefined}>
          ⭐
        </span>
        <span aria-hidden>{ganhas !== null && ganhas > 0 ? `+${ganhas}` : (estrelasTotal ?? "…")}</span>
      </div>

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
                className="animate-crianca-entrar flex min-h-16 items-center gap-2 rounded-2xl bg-[var(--c-teia)] px-4 text-3xl font-black text-white shadow-[0_5px_0_var(--c-teia-sombra)] touch-manipulation transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
              >
                <span aria-hidden>🕸️</span>
                {exibir(p.palavra, minusculas)}
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
                className="animate-crianca-entrar flex min-h-20 items-center gap-3 rounded-3xl bg-white px-4 py-2 shadow-[0_5px_0_var(--c-sol-sombra)] ring-4 ring-[var(--c-sol)] touch-manipulation focus-visible:outline-none focus-visible:ring-[var(--c-foco)]"
              >
                <span aria-hidden className="text-5xl leading-none">
                  {c.emoji || "🏅"}
                </span>
                <span className="text-xl font-black">{exibir(c.titulo, minusculas)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-center gap-4 pt-2">
        <BotaoGrande rotulo="Voltar ao mapa" cor="branco" tamanho={96} className="px-8" onClick={() => router.push("/app")}>
          <span aria-hidden className="text-5xl leading-none">
            🗺️
          </span>
        </BotaoGrande>
        {proxima && (
          <BotaoGrande
            rotulo="Próxima missão"
            cor="grama"
            tamanho={96}
            destaque
            className="animate-crianca-entrar px-8"
            onClick={() => router.push(`/app/missao/${proxima.id}`)}
          >
            <span aria-hidden className="text-5xl leading-none">
              🚀
            </span>
          </BotaoGrande>
        )}
      </div>
    </section>
  );
}
