"use client";

import { ArrowLeft, ArrowRight, Play, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Reacoes } from "@/components/crianca/amigos/reacoes";
import { ProvedorEnvioResposta, type EnviarResposta } from "@/components/crianca/atividades/envio-resposta";
import { AtividadeAtual } from "@/components/crianca/atividades/registro";
import { AvisoConquistas, type LoteConquistas } from "@/components/crianca/aula/aviso-conquistas";
import { cancelarNarracao, type Trecho } from "@/components/crianca/aula/narrador";
import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { COPY } from "@/lib/copy";
import { aulaDaMiniAula } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";
import { falar, parar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { UnauthorizedError } from "@/services/apiError";
import { buscarEntrega, reagirEntrega, responderEntrega } from "@/services/crianca";
import type { Conquista, EntregaAberta, Reacao } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; entrega: EntregaAberta };
type Passo = "ouvir" | "jogar" | "reagir";

/**
 * Jogar a aula de um amigo: ouvir a voz dele → responder o desafio (mesmos
 * componentes e mesma política de feedback das missões) → reagir com um
 * toque. Amigo = apelido e avatar; a resposta certa só aparece no 2º erro.
 */
export function JogarMiniAula({ entregaId }: { entregaId: number }) {
  const router = useRouter();
  const { crianca } = useCrianca();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [passo, setPasso] = useState<Passo>("ouvir");
  const [instrucao, setInstrucao] = useState<Trecho>({ texto: COPY.amigos.responder });
  const [lote, setLote] = useState<LoteConquistas | null>(null);
  const [reagindo, setReagindo] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () => () => {
      cancelarNarracao();
      parar();
    },
    [],
  );

  useEffect(() => {
    let ativo = true;

    buscarEntrega(entregaId)
      .then((entrega) => {
        if (ativo) setEstado({ tipo: "pronto", entrega });
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
  }, [entregaId, tentativa, router]);

  const entrega = estado.tipo === "pronto" ? estado.entrega : null;
  const apelido = entrega?.mini_aula.autor.apelido ?? "";
  const minusculas = crianca?.usa_minusculas ?? true;

  const textoFixo =
    estado.tipo === "erro" ? COPY.amigos.erro : entrega ? (passo === "ouvir" ? COPY.amigos.ouvirInstrucao(apelido) : passo === "reagir" ? COPY.amigos.reagirInstrucao : null) : null;

  useFalarAoChegar(textoFixo);

  const falaDoTopo: Trecho = passo === "jogar" && entrega ? instrucao : { texto: textoFixo ?? COPY.amigos.responder };

  const enviar = useCallback<EnviarResposta>((_ordem, resposta) => responderEntrega(entregaId, resposta), [entregaId]);
  const mostrarConquistas = useCallback((conquistas: Conquista[]) => setLote({ id: Date.now(), conquistas }), []);
  const nada = useCallback(() => {}, []);
  const concluir = useCallback(() => setPasso("reagir"), []);

  async function reagir(reacao: Reacao) {
    if (!entrega) return;

    setReagindo(true);

    try {
      await reagirEntrega(entrega.id, reacao);
    } catch {
      // A reação é um mimo: sem ela a aula já está respondida.
    }

    sons.conquista();
    router.push("/app/amigos");
  }

  if (estado.tipo === "carregando") {
    return <TelaCarregando />;
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={falaDoTopo.texto} audioUrl={falaDoTopo.audio_url ?? null}>
        <BotaoGrande rotulo={COPY.amigos.voltar} cor="neutra" tamanho={64} onClick={() => router.push("/app/amigos")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        {entrega ? (
          <h1 className="flex min-w-0 items-center gap-3 text-2xl font-black sm:text-3xl">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]"
              style={{ backgroundColor: entrega.mini_aula.autor.avatar?.cor ?? "var(--c-superficie-2)" }}
            >
              <Icone nome={entrega.mini_aula.autor.avatar?.icone ?? "user"} className="size-7" strokeWidth={2.25} />
            </span>
            <span className="truncate">{exibir(`Aula de ${apelido}`, minusculas)}</span>
          </h1>
        ) : null}
      </BarraTopo>

      {estado.tipo === "erro" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
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

      {entrega && passo === "ouvir" ? (
        <section aria-label="Ouvir a aula" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 text-center">
          <h2 className="max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight">{exibir(entrega.mini_aula.titulo, minusculas)}</h2>
          <BotaoGrande
            rotulo={COPY.amigos.ouvir}
            cor="primaria"
            tamanho={128}
            destaque
            onClick={() => void falar(entrega.mini_aula.titulo, entrega.mini_aula.audio_url)}
          >
            <Play className="size-16 fill-current" aria-hidden />
          </BotaoGrande>
          <BotaoGrande rotulo={COPY.amigos.responder} cor="sucesso" tamanho={96} className="px-8" onClick={() => setPasso("jogar")}>
            <ArrowRight className="size-12" aria-hidden strokeWidth={3} />
            <span aria-hidden>{exibir(COPY.amigos.responder, minusculas)}</span>
          </BotaoGrande>
        </section>
      ) : null}

      {entrega && passo === "jogar" ? (
        <div className="flex flex-1 flex-col pt-2">
          <ProvedorEnvioResposta enviar={enviar}>
            <AtividadeAtual
              aula={aulaDaMiniAula(entrega)}
              atividade={entrega.atividade}
              minusculas={minusculas}
              aoConcluir={concluir}
              definirInstrucao={setInstrucao}
              mostrarConquistas={mostrarConquistas}
              aoDescobrir={nada}
            />
          </ProvedorEnvioResposta>
        </div>
      ) : null}

      {entrega && passo === "reagir" ? (
        <section aria-label="Reagir" className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-8 text-center">
          <h2 className="max-w-2xl text-[clamp(1.5rem,4.5vw,2.5rem)] font-black leading-tight">{exibir(COPY.amigos.reagirInstrucao, minusculas)}</h2>
          <Reacoes minusculas={minusculas} enviando={reagindo} aoReagir={(r) => void reagir(r)} />
        </section>
      ) : null}

      <AvisoConquistas lote={lote} minusculas={minusculas} aoSumir={() => setLote(null)} />
    </main>
  );
}
