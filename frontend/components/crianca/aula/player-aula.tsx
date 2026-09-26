"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { AvisoConquistas, type LoteConquistas } from "@/components/crianca/aula/aviso-conquistas";
import { BarraAula } from "@/components/crianca/aula/barra-aula";
import { EtapaConquista } from "@/components/crianca/aula/etapas/etapa-conquista";
import { EtapaConversa } from "@/components/crianca/aula/etapas/etapa-conversa";
import { EtapaCriacao } from "@/components/crianca/aula/etapas/etapa-criacao";
import { EtapaFicha } from "@/components/crianca/aula/etapas/etapa-ficha";
import { EtapaMissao } from "@/components/crianca/aula/etapas/etapa-missao";
import { EtapaPalavra } from "@/components/crianca/aula/etapas/etapa-palavra";
import { EtapaPalmas } from "@/components/crianca/aula/etapas/etapa-palmas";
import { EtapaProducao } from "@/components/crianca/aula/etapas/etapa-producao";
import { cancelarNarracao, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import type { PropsEtapa } from "@/components/crianca/aula/tipos";
import { useWakeLock } from "@/components/crianca/aula/use-wake-lock";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { useCrianca } from "@/context/CriancaContext";
import { estadoInicial, motorAula, nomeDaEtapa, TOTAL_ETAPAS } from "@/lib/aula/motor";
import { criarSincronizador, type Sincronizador } from "@/lib/aula/sincronia";
import { parar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { ApiError, UnauthorizedError } from "@/services/apiError";
import {
  concluirAula as concluirAulaApi,
  concluirEtapa as concluirEtapaApi,
  iniciarAula,
} from "@/services/crianca";
import type { Conquista, ResultadoConclusao } from "@/types/CriancaApp";

const FALA_TRANCADA = "Essa missão ainda está trancada";
const FALA_FALHA = "Não consegui abrir a missão. Vamos tentar de novo?";

/** Tela simples de espera/aviso, sempre com saída para o mapa. */
function TelaAviso({
  emoji,
  fala,
  falarNaChegada = true,
  pulsar = false,
  aoTentarDeNovo,
}: {
  emoji: string;
  /** O que o alto-falante repete (null = sem alto-falante, ex.: carregando). */
  fala: string | null;
  /** false quando quem abriu a tela já está falando (ex.: missão trancada). */
  falarNaChegada?: boolean;
  pulsar?: boolean;
  aoTentarDeNovo?: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (fala && falarNaChegada) void narrar(fala);
  }, [fala, falarNaChegada]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5">
        <BotaoGrande rotulo="Voltar ao mapa" cor="branco" tamanho={64} onClick={() => router.push("/app")}>
          <span aria-hidden className="text-3xl leading-none">
            🗺️
          </span>
        </BotaoGrande>
        {fala && (
          <div onClickCapture={cancelarNarracao}>
            <BotaoOuvir texto={fala} />
          </div>
        )}
      </header>
      <main
        role={fala ? undefined : "status"}
        aria-label={fala ? undefined : "Carregando"}
        className="flex flex-1 flex-col items-center justify-center gap-8 px-4"
      >
        <span aria-hidden className={pulsar ? "animate-crianca-pulso text-8xl" : "text-8xl"}>
          {emoji}
        </span>
        {aoTentarDeNovo && (
          <BotaoGrande rotulo="Tentar de novo" cor="ceu" tamanho={96} destaque onClick={aoTentarDeNovo}>
            <span aria-hidden className="text-5xl leading-none">
              🔄
            </span>
          </BotaoGrande>
        )}
      </main>
    </div>
  );
}

/**
 * Player da aula: carrega (POST /iniciar), retoma na etapa_atual, mostra a
 * etapa da vez com a barra de cima (mapa · trilha · alto-falante) e avisa o
 * servidor, de forma otimista, a cada etapa concluída.
 */
export function PlayerAula({ id }: { id: number }) {
  const router = useRouter();
  const { crianca, atualizar, recarregar } = useCrianca();
  const [estado, despachar] = useReducer(motorAula, estadoInicial);
  const [falha, setFalha] = useState<"trancada" | "rede" | null>(null);
  const [carga, setCarga] = useState(0);
  const [instrucao, setInstrucao] = useState<Trecho>({ texto: "Vamos começar a missão!" });
  const [lote, setLote] = useState<LoteConquistas | null>(null);
  const [estrelasNoInicio] = useState(() => crianca?.estrelas ?? null);
  const sincronizador = useRef<Sincronizador | null>(null);
  const refConteudo = useRef<HTMLElement | null>(null);

  useWakeLock();

  // Sair do player corta qualquer narração em andamento.
  useEffect(
    () => () => {
      cancelarNarracao();
      parar();
    },
    [],
  );

  useEffect(() => {
    let ativo = true;

    if (!Number.isInteger(id) || id <= 0) {
      router.replace("/app");

      return;
    }

    iniciarAula(id)
      .then((aula) => {
        if (!ativo) return;

        sincronizador.current = criarSincronizador(
          (n) => concluirEtapaApi(id, n),
          aula.status === "concluida" ? TOTAL_ETAPAS : aula.etapa_atual,
          (etapaAtual) => despachar({ tipo: "sincronizar", etapaAtual }),
        );
        despachar({ tipo: "carregar", aula });
      })
      .catch(async (erro: unknown) => {
        if (!ativo) return;

        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        if (erro instanceof ApiError && (erro.status === 403 || erro.status === 404)) {
          setFalha("trancada");
          // A fala resolve no fim ou no tempo máximo: nunca fica presa aqui.
          await narrar(FALA_TRANCADA);

          if (ativo) router.replace("/app");

          return;
        }

        setFalha("rede");
      });

    return () => {
      ativo = false;
    };
  }, [id, router, carga]);

  // Etapa nova começa do topo.
  useEffect(() => {
    refConteudo.current?.scrollTo({ top: 0 });
  }, [estado.etapaVisivel]);

  const etapaVisivel = estado.etapaVisivel;

  const concluirEtapa = useCallback(() => {
    despachar({ tipo: "concluirEtapa", etapa: etapaVisivel });

    if (etapaVisivel < TOTAL_ETAPAS) {
      void sincronizador.current?.concluir(etapaVisivel);
    }
  }, [etapaVisivel]);

  const irPara = useCallback((etapa: number) => despachar({ tipo: "irPara", etapa }), []);

  const mostrarConquistas = useCallback((conquistas: Conquista[]) => {
    if (conquistas.length === 0) return;

    sons.conquista();
    setLote({ id: Date.now(), conquistas });
  }, []);

  const esconderConquistas = useCallback(() => setLote(null), []);

  const descobrirPalavra = useCallback((palavra: string, audioUrl: string | null) => {
    despachar({ tipo: "descobrirPalavra", palavra, audio_url: audioUrl });
  }, []);

  /** Garante as etapas 1..7 no servidor e conclui a aula (tenta 2 vezes). Nunca rejeita. */
  const concluirMissao = useCallback(async (): Promise<ResultadoConclusao | null> => {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      await sincronizador.current?.concluir(TOTAL_ETAPAS - 1);

      try {
        const r = await concluirAulaApi(id);

        despachar({ tipo: "concluirAula" });
        atualizar({ estrelas: r.estrelas });
        void recarregar();

        return r;
      } catch (erro) {
        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return null;
        }
        // 422 ("ainda falta um pouquinho") ou rede: sincroniza e tenta mais uma vez.
      }
    }

    return null;
  }, [id, atualizar, recarregar, router]);

  if (falha === "trancada") {
    return <TelaAviso emoji="🔒" fala={FALA_TRANCADA} falarNaChegada={false} />;
  }

  if (falha === "rede") {
    return (
      <TelaAviso
        emoji="🌧️"
        fala={FALA_FALHA}
        aoTentarDeNovo={() => {
          setFalha(null);
          setCarga((c) => c + 1);
        }}
      />
    );
  }

  if (!estado.aula) {
    return <TelaAviso emoji="🕸️" fala={null} pulsar />;
  }

  const aula = estado.aula;
  const minusculas = crianca?.usa_minusculas ?? false;
  const etapa = nomeDaEtapa(etapaVisivel);
  const props: PropsEtapa = {
    aula,
    minusculas,
    aoConcluir: concluirEtapa,
    definirInstrucao: setInstrucao,
    mostrarConquistas,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BarraAula
        etapaAtual={estado.etapaAtual}
        etapaVisivel={etapaVisivel}
        concluidas={estado.concluidas}
        aoIr={irPara}
        instrucao={instrucao}
        estrelas={crianca?.estrelas ?? null}
        mostrarVoltar={etapa !== "conquista"}
      />

      <main ref={refConteudo} className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pt-2">
        <h1 className="sr-only">{aula.titulo}</h1>
        {etapa === "missao" && <EtapaMissao key={etapa} {...props} />}
        {etapa === "conversa" && <EtapaConversa key={etapa} {...props} />}
        {etapa === "palavra" && <EtapaPalavra key={etapa} {...props} />}
        {etapa === "palmas" && <EtapaPalmas key={etapa} {...props} />}
        {etapa === "ficha" && <EtapaFicha key={etapa} {...props} />}
        {etapa === "criacao" && <EtapaCriacao key={etapa} {...props} aoDescobrir={descobrirPalavra} />}
        {etapa === "producao" && <EtapaProducao key={etapa} {...props} />}
        {etapa === "conquista" && (
          <EtapaConquista key={etapa} {...props} concluirMissao={concluirMissao} estrelasNoInicio={estrelasNoInicio} />
        )}
      </main>

      <AvisoConquistas lote={lote} minusculas={minusculas} aoSumir={esconderConquistas} />
    </div>
  );
}
