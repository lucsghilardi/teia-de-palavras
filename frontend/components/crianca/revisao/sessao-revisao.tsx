"use client";

import { ArrowLeft, CalendarCheck, RefreshCw, RotateCcw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProvedorEnvioResposta, type EnviarResposta } from "@/components/crianca/atividades/envio-resposta";
import { AtividadeAtual } from "@/components/crianca/atividades/registro";
import { AvisoConquistas, type LoteConquistas } from "@/components/crianca/aula/aviso-conquistas";
import { celebrar } from "@/components/crianca/aula/celebrar";
import { cancelarNarracao, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import { Pontinhos } from "@/components/crianca/aula/pontinhos";
import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { aulaDaRevisao, resumoDaRevisao } from "@/lib/crianca/revisao";
import { exibir } from "@/lib/exibir";
import { parar } from "@/lib/fala";
import { UnauthorizedError } from "@/services/apiError";
import { buscarRevisao, responderRevisao } from "@/services/crianca";
import type { Conquista, ItemRevisao } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; itens: ItemRevisao[]; devidos: number };

const FALA_VAZIA = "Sua revisão está em dia! Amanhã tem mais.";
const FALA_ERRO = "Não consegui abrir a revisão. Toque no botão para tentar de novo.";
const TITULO = "Revisão";

/**
 * A Revisão do dia: até 6 itens vencidos, um por vez, jogados com os mesmos
 * componentes das atividades (a resposta vai para /revisao/{item}/responder
 * pelo provedor de envio). No fim, um resumo do que foi feito — sem nota.
 */
export function SessaoRevisao() {
  const router = useRouter();
  const { crianca, atualizar } = useCrianca();
  const reduzido = useMovimentoReduzido();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [carga, setCarga] = useState(0);
  const [indice, setIndice] = useState(0);
  const [xp, setXp] = useState(0);
  const [instrucao, setInstrucao] = useState<Trecho>({ texto: "Vamos revisar!" });
  const [lote, setLote] = useState<LoteConquistas | null>(null);

  // Sair da tela corta qualquer narração em andamento.
  useEffect(
    () => () => {
      cancelarNarracao();
      parar();
    },
    [],
  );

  useEffect(() => {
    let ativo = true;

    buscarRevisao()
      .then(({ itens, devidos }) => {
        if (!ativo) return;

        setEstado({ tipo: "pronto", itens, devidos });
        setIndice(0);
        setXp(0);
        atualizar({ revisao_devidos: devidos });
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
  }, [carga, router, atualizar]);

  const itens = estado.tipo === "pronto" ? estado.itens : [];
  const devidos = estado.tipo === "pronto" ? estado.devidos : 0;
  const item = itens[indice] ?? null;
  const vazia = estado.tipo === "pronto" && itens.length === 0;
  const fim = estado.tipo === "pronto" && itens.length > 0 && indice >= itens.length;
  const restantes = Math.max(0, devidos - itens.length);
  const resumo = resumoDaRevisao(itens.length, xp, restantes);
  const minusculas = crianca?.usa_minusculas ?? false;

  const enviar = useCallback<EnviarResposta>(
    async (_ordem, resposta) => {
      if (!item) throw new Error("Sem item de revisão.");

      const r = await responderRevisao(item.id, resposta);
      setXp((atual) => atual + r.xp_ganho);

      return r;
    },
    [item],
  );

  const mostrarConquistas = useCallback((conquistas: Conquista[]) => {
    setLote({ id: Date.now(), conquistas });
  }, []);

  const proximo = useCallback(() => {
    setIndice((i) => i + 1);
  }, []);

  const nada = useCallback(() => {}, []);

  // Fim da sessão: comemora e fala o resumo (uma vez).
  useEffect(() => {
    if (!fim) return;

    celebrar(reduzido);
    void narrar(resumo);
    atualizar({ revisao_devidos: restantes });
    // Só quando chega ao fim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fim]);

  useEffect(() => {
    if (vazia) void narrar(FALA_VAZIA);
    else if (estado.tipo === "erro") void narrar(FALA_ERRO);
  }, [vazia, estado.tipo]);

  // O alto-falante repete a fala da tela: nas telas fixas ela é conhecida; no item, a atividade define.
  const falaDoTopo: Trecho = fim ? { texto: resumo } : vazia ? { texto: FALA_VAZIA } : estado.tipo === "erro" ? { texto: FALA_ERRO } : instrucao;

  if (estado.tipo === "carregando") {
    return <TelaCarregando />;
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[radial-gradient(circle_at_50%_0%,#EAF8E6_0%,var(--c-fundo)_60%)]">
      <BarraTopo instrucao={falaDoTopo.texto} audioUrl={falaDoTopo.audio_url ?? null}>
        <BotaoGrande rotulo="Voltar ao mapa" cor="branco" tamanho={64} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <RotateCcw className="size-8 text-[var(--c-grama)]" aria-hidden strokeWidth={2.5} />
          {exibir(TITULO, minusculas)}
        </h1>
        {item ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="sr-only">{`Item ${indice + 1} de ${itens.length}`}</span>
            <Pontinhos total={itens.length} atual={indice} />
          </div>
        ) : null}
      </BarraTopo>

      {estado.tipo === "erro" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <RotateCcw className="size-24 text-[var(--c-borda)]" aria-hidden />
          <BotaoGrande
            rotulo="Tentar de novo"
            cor="ceu"
            tamanho={96}
            destaque
            onClick={() => {
              setEstado({ tipo: "carregando" });
              setCarga((n) => n + 1);
            }}
          >
            <RefreshCw className="size-12" aria-hidden />
          </BotaoGrande>
        </div>
      ) : null}

      {vazia ? (
        <section aria-label="Revisão em dia" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <CalendarCheck className="size-28 text-[var(--c-grama)]" aria-hidden strokeWidth={2} />
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight">{exibir("Revisão em dia!", minusculas)}</h2>
          <p className="max-w-md text-2xl font-bold opacity-80">{exibir("Amanhã tem mais.", minusculas)}</p>
          <BotaoGrande rotulo="Voltar ao mapa" cor="grama" tamanho={96} destaque className="px-8" onClick={() => router.push("/app")}>
            <ArrowLeft className="size-12" aria-hidden />
          </BotaoGrande>
        </section>
      ) : null}

      {item ? (
        <div key={item.id} className="flex flex-1 flex-col pt-2">
          <ProvedorEnvioResposta enviar={enviar}>
            <AtividadeAtual
              aula={aulaDaRevisao(item)}
              atividade={item.atividade}
              minusculas={minusculas}
              aoConcluir={proximo}
              definirInstrucao={setInstrucao}
              mostrarConquistas={mostrarConquistas}
              aoDescobrir={nada}
            />
          </ProvedorEnvioResposta>
        </div>
      ) : null}

      {fim ? (
        <section aria-label="Revisão feita" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <CalendarCheck className="size-28 text-[var(--c-grama)]" aria-hidden strokeWidth={2} />
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight">{exibir("Revisão feita!", minusculas)}</h2>
          <p className="max-w-md text-2xl font-bold opacity-80">
            {exibir(itens.length === 1 ? "Você revisou 1 item." : `Você revisou ${itens.length} itens.`, minusculas)}
          </p>
          {xp > 0 ? (
            <div
              role="img"
              aria-label={xp === 1 ? "Você ganhou 1 ponto" : `Você ganhou ${xp} pontos`}
              className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-4xl font-black shadow-[0_6px_0_var(--c-sol-sombra)] ring-4 ring-[var(--c-sol)]"
            >
              <Star className="size-10 fill-[var(--c-sol)] text-[var(--c-sol-sombra)]" aria-hidden />
              <span aria-hidden>+{xp}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <BotaoGrande rotulo="Voltar ao mapa" cor="branco" tamanho={96} className="px-8" onClick={() => router.push("/app")}>
              <ArrowLeft className="size-12" aria-hidden />
            </BotaoGrande>
            {restantes > 0 ? (
              <BotaoGrande
                rotulo="Revisar mais"
                cor="grama"
                tamanho={96}
                destaque
                className="px-8"
                onClick={() => {
                  setEstado({ tipo: "carregando" });
                  setCarga((n) => n + 1);
                }}
              >
                <RotateCcw className="size-12" aria-hidden />
              </BotaoGrande>
            ) : null}
          </div>
        </section>
      ) : null}

      <AvisoConquistas lote={lote} minusculas={minusculas} aoSumir={() => setLote(null)} />
    </main>
  );
}
