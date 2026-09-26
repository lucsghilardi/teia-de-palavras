"use client";

import { Eraser, Send, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { celebrar } from "@/components/crianca/aula/celebrar";
import { falasDeConquistas, narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { useTratarSessao } from "@/components/crianca/aula/sessao";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { adicionar, BANDEJA_VAZIA, cheia, limpar, remover, texto, vazia, type Bandeja } from "@/lib/aula/bandeja";
import { palavrasDaProducao } from "@/lib/aula/conteudo";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/apiError";
import { enviarProducao } from "@/services/crianca";
import type { AtividadeFrase } from "@/types/CriancaApp";

const MAX_FRASE = 8;

const INSTRUCAO = {
  texto: "Toque nas palavras para montar uma frase sobre a missão. Depois, toque no aviãozinho para enviar.",
};

const CHIP =
  "flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-2xl px-4 font-black touch-manipulation select-none transition-transform active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]";

/**
 * FRASE (produção): montar uma frase curta com as palavras da Teia da
 * criança + palavrinhas (O, A, UM, TEM...). (Ditar por voz: fase futura.)
 */
export function Frase({ aula, atividade, minusculas, aoConcluir, definirInstrucao, mostrarConquistas }: PropsAtividade<AtividadeFrase>) {
  const { atualizar } = useCrianca();
  const tratarSessao = useTratarSessao();
  const reduzido = useMovimentoReduzido();
  const MIN_FRASE = Math.max(1, atividade.minimo);
  const palavras = useMemo(
    () => palavrasDaProducao(atividade.teia, atividade.palavrinhas),
    [atividade.teia, atividade.palavrinhas],
  );
  const audioDa = useMemo(() => new Map(palavras.map((p) => [p.palavra, p.audio_url])), [palavras]);
  const daTeia = palavras.filter((p) => !p.palavrinha);
  const palavrinhas = palavras.filter((p) => p.palavrinha);

  const [frase, setFrase] = useState<Bandeja>(BANDEJA_VAZIA);
  const [enviada, setEnviada] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const narrou = useNarracaoDeChegada("producao", [INSTRUCAO], INSTRUCAO, definirInstrucao);

  const falarPalavra = (palavra: string) => void narrar({ texto: palavra, audio_url: audioDa.get(palavra) ?? null });

  const escolher = (palavra: string) => {
    sons.toque();

    if (cheia(frase, MAX_FRASE)) {
      sons.dica();
      void narrar("Sua frase já está bem grande! Toque em ouvir ou em enviar.");

      return;
    }

    falarPalavra(palavra);
    setFrase((f) => adicionar(f, palavra, MAX_FRASE));
  };

  const tirar = (indice: number) => {
    sons.toque();
    const palavra = frase[indice];

    if (palavra) falarPalavra(palavra);

    setFrase((f) => remover(f, indice));
  };

  const apagar = () => {
    setFrase(limpar());
    void narrar(vazia(frase) ? "Toque nas palavras para montar a sua frase." : "Tudo limpo!");
  };

  const ouvirFrase = () => {
    void narrar(vazia(frase) ? "Sua frase ainda está vazia. Toque nas palavras!" : texto(frase, " "));
  };

  const enviar = async () => {
    if (frase.length < MIN_FRASE || enviando) return;

    setEnviando(true);

    try {
      const r = await enviarProducao(aula.id, [...frase]);

      celebrar(reduzido);
      atualizar({ estrelas: r.estrelas });
      setEnviada(r.texto || texto(frase, " "));

      if (r.conquistas.length > 0) mostrarConquistas(r.conquistas);

      void narrar([
        { texto: r.texto || texto(frase, " ") },
        { texto: "Que frase bonita! Você escreveu uma frase." },
        ...falasDeConquistas(r.conquistas),
      ]);
    } catch (erro) {
      if (tratarSessao(erro)) return;

      sons.dica();
      setFalhou(true);
      void narrar(
        erro instanceof ApiError && erro.status === 422 && erro.message
          ? erro.message
          : "Não consegui enviar agora. Vamos tentar de novo?",
      );
    } finally {
      setEnviando(false);
    }
  };

  const chipPalavra = (p: { palavra: string; palavrinha: boolean }) => (
    <li key={p.palavra}>
      <button
        type="button"
        aria-label={`Palavra ${p.palavra}`}
        onClick={() => escolher(p.palavra)}
        className={cn(
          CHIP,
          p.palavrinha
            ? "bg-white text-2xl shadow-[0_4px_0_var(--c-borda)]"
            : "bg-[var(--c-teia)] text-3xl text-white shadow-[0_5px_0_var(--c-teia-sombra)]",
        )}
      >
        {!p.palavrinha && <span aria-hidden>🕸️</span>}
        {exibir(p.palavra, minusculas)}
      </button>
    </li>
  );

  return (
    <section aria-label="Fazer uma frase" className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6">
      {/* Tira da frase */}
      <div
        role="group"
        aria-label="Minha frase"
        className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-[2rem] border-4 border-dashed border-[var(--c-borda)] bg-white/85 p-3"
      >
        {frase.length === 0 ? (
          <span aria-hidden className="text-5xl opacity-40">
            ✏️
          </span>
        ) : (
          frase.map((palavra, i) => (
            <button
              key={`${i}-${palavra}`}
              type="button"
              aria-label={`Tirar ${palavra}`}
              onClick={() => tirar(i)}
              className={cn(CHIP, "animate-crianca-entrar bg-[var(--c-sol)] text-3xl shadow-[0_5px_0_var(--c-sol-sombra)]")}
            >
              {exibir(palavra, minusculas)}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <BotaoGrande rotulo="Apagar" cor="branco" tamanho={80} onClick={apagar}>
          <Eraser className="size-9" strokeWidth={2.5} aria-hidden />
        </BotaoGrande>
        <BotaoGrande rotulo="Ouvir minha frase" cor="ceu" tamanho={80} onClick={ouvirFrase}>
          <Volume2 className="size-9" strokeWidth={2.5} aria-hidden />
        </BotaoGrande>
        <BotaoGrande
          rotulo="Enviar frase"
          cor="grama"
          tamanho={96}
          disabled={frase.length < MIN_FRASE}
          destaque={frase.length >= MIN_FRASE && !enviada && !enviando}
          aria-busy={enviando || undefined}
          onClick={() => void enviar()}
        >
          <Send className="size-11" strokeWidth={2.5} aria-hidden />
        </BotaoGrande>
      </div>

      {enviada && (
        <p className="animate-crianca-entrar mx-auto flex max-w-full items-center gap-3 rounded-[2rem] bg-white px-5 py-3 text-center text-3xl font-black shadow-[0_6px_0_var(--c-grama-sombra)] ring-4 ring-[var(--c-grama)]">
          <span aria-hidden>⭐</span>
          <span className="break-words">{exibir(enviada, minusculas)}</span>
        </p>
      )}

      <div className="flex flex-1 flex-col gap-3">
        {daTeia.length > 0 && (
          <ul aria-label="Palavras da minha teia" className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {daTeia.map(chipPalavra)}
          </ul>
        )}
        <ul aria-label="Palavrinhas" className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {palavrinhas.map(chipPalavra)}
        </ul>
      </div>

      <div className="flex min-h-[88px] shrink-0 justify-end">
        {(enviada || falhou) && (
          <BotaoContinuar destaque={Boolean(enviada) || narrou} onClick={aoConcluir} className="animate-crianca-entrar" />
        )}
      </div>
    </section>
  );
}
