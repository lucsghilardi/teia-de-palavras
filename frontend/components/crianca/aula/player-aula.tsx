"use client";

import { ArrowLeft, CloudOff, Lock, Orbit, RefreshCw, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useCallback, useEffect, useReducer, useRef, useState } from "react";

import { AtividadeAtual } from "@/components/crianca/atividades/registro";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { AvisoConquistas, type LoteConquistas } from "@/components/crianca/aula/aviso-conquistas";
import { BarraAula } from "@/components/crianca/aula/barra-aula";
import { FaixaCena, temFaixaCena } from "@/components/crianca/aula/faixa-cena";
import { cancelarNarracao, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import { TelaConquista } from "@/components/crianca/aula/tela-conquista";
import { useWakeLock } from "@/components/crianca/aula/use-wake-lock";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { useCrianca } from "@/context/CriancaContext";
import { COPY } from "@/lib/copy";
import { atividadeVisivel, ehConquista, estadoInicial, motorAula, totalEtapas } from "@/lib/aula/motor";
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

const FALA_TRANCADA = COPY.missao.trancada;
const FALA_FALHA = COPY.missao.falha;

/** Tela simples de espera/aviso, sempre com saída para a Galáxia. */
function TelaAviso({
  icone,
  fala,
  falarNaChegada = true,
  pulsar = false,
  aoTentarDeNovo,
}: {
  icone: LucideIcon;
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
        <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={64} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
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
        {createElement(icone, {
          "aria-hidden": true,
          strokeWidth: 1.75,
          className: pulsar ? "size-24 animate-crianca-pulso text-[var(--c-primaria)]" : "size-24 text-[var(--c-borda)]",
        })}
        {aoTentarDeNovo && (
          <BotaoGrande rotulo={COPY.comum.tentarDeNovo} cor="primaria" tamanho={96} destaque onClick={aoTentarDeNovo}>
            <RefreshCw className="size-12" aria-hidden />
          </BotaoGrande>
        )}
      </main>
    </div>
  );
}

/**
 * Player da missão: carrega (POST /iniciar), retoma na etapa_atual, mostra a
 * atividade da vez (escolhida pelo registro de tipos) com a barra de cima
 * (mapa · trilha · alto-falante) e avisa o servidor, de forma otimista, a
 * cada etapa concluída. Depois da última atividade vem a tela de conquista.
 */
export function PlayerAula({ id }: { id: number }) {
  const router = useRouter();
  const { crianca, atualizar, recarregar } = useCrianca();
  const [estado, despachar] = useReducer(motorAula, estadoInicial);
  const [falha, setFalha] = useState<"trancada" | "rede" | null>(null);
  const [carga, setCarga] = useState(0);
  const [instrucao, setInstrucao] = useState<Trecho>({ texto: "Vamos começar a missão!" });
  const [lote, setLote] = useState<LoteConquistas | null>(null);
  const [xpNoInicio] = useState(() => crianca?.xp ?? null);
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

        const total = totalEtapas(aula);

        sincronizador.current = criarSincronizador(
          (n) => concluirEtapaApi(id, n),
          aula.status === "concluida" ? total : aula.etapa_atual,
          total,
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
  const total = estado.total;

  const concluirEtapa = useCallback(() => {
    despachar({ tipo: "concluirEtapa", etapa: etapaVisivel });

    if (etapaVisivel < total) {
      void sincronizador.current?.concluir(etapaVisivel);
    }
  }, [etapaVisivel, total]);

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

  /** Garante as etapas 1..N no servidor e conclui a missão (tenta 2 vezes). Nunca rejeita. */
  const concluirMissao = useCallback(async (): Promise<ResultadoConclusao | null> => {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      await sincronizador.current?.concluir(total - 1);

      try {
        const r = await concluirAulaApi(id);

        despachar({ tipo: "concluirAula" });
        atualizar({ xp: r.xp_total });
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
  }, [id, total, atualizar, recarregar, router]);

  if (falha === "trancada") {
    return <TelaAviso icone={Lock} fala={FALA_TRANCADA} falarNaChegada={false} />;
  }

  if (falha === "rede") {
    return (
      <TelaAviso
        icone={CloudOff}
        fala={FALA_FALHA}
        aoTentarDeNovo={() => {
          setFalha(null);
          setCarga((c) => c + 1);
        }}
      />
    );
  }

  if (!estado.aula) {
    return <TelaAviso icone={Orbit} fala={null} pulsar />;
  }

  const aula = estado.aula;
  const minusculas = crianca?.usa_minusculas ?? true;
  const atividade = atividadeVisivel(estado);
  const conquista = ehConquista(estado);
  const props: Omit<PropsAtividade, "atividade"> = {
    aula,
    minusculas,
    aoConcluir: concluirEtapa,
    definirInstrucao: setInstrucao,
    mostrarConquistas,
    aoDescobrir: descobrirPalavra,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BarraAula
        disciplina={aula.disciplina}
        atividades={aula.atividades}
        etapaAtual={estado.etapaAtual}
        etapaVisivel={etapaVisivel}
        concluidas={estado.concluidas}
        aoIr={irPara}
        instrucao={instrucao}
        xp={crianca?.xp ?? null}
        mostrarVoltar={!conquista}
      />

      <main ref={refConteudo} className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pt-2">
        <h1 className="sr-only">{aula.titulo}</h1>
        {atividade && temFaixaCena(atividade) ? <FaixaCena key={`cena-${atividade.ordem}`} atividade={atividade} /> : null}
        {atividade ? (
          <AtividadeAtual key={`${atividade.tipo}-${atividade.ordem}`} {...props} atividade={atividade} />
        ) : conquista ? (
          <TelaConquista
            key="conquista"
            aula={aula}
            minusculas={minusculas}
            definirInstrucao={setInstrucao}
            mostrarConquistas={mostrarConquistas}
            concluirMissao={concluirMissao}
            xpNoInicio={xpNoInicio}
          />
        ) : null}
      </main>

      <AvisoConquistas lote={lote} minusculas={minusculas} aoSumir={esconderConquistas} />
    </div>
  );
}
