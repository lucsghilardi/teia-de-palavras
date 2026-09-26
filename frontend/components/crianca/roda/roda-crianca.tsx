"use client";

import { ArrowLeft, CloudOff, Orbit, RefreshCw, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProvedorEnvioResposta, type EnviarProducao, type EnviarResposta, type TentarPalavra } from "@/components/crianca/atividades/envio-resposta";
import { AtividadeAtual } from "@/components/crianca/atividades/registro";
import { AvisoConquistas, type LoteConquistas } from "@/components/crianca/aula/aviso-conquistas";
import { celebrar } from "@/components/crianca/aula/celebrar";
import { cancelarNarracao, narrar, type Trecho } from "@/components/crianca/aula/narrador";
import { TrilhaEtapas } from "@/components/crianca/aula/trilha-etapas";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { PainelDupla } from "@/components/crianca/roda/painel-dupla";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { BotaoOuvir } from "@/components/crianca/ui/botao-ouvir";
import { Icone } from "@/components/crianca/ui/icone";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { useRodaTempoReal } from "@/hooks/use-roda-tempo-real";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import { parar } from "@/lib/fala";
import { descreverResposta, ehMinhaVez, falaDoResultado, parceiro as parceiroDe, propostaAberta, respostaDeMudar, tentativaDeMudar } from "@/lib/roda/dupla";
import { sons } from "@/lib/sons";
import { ApiError, UnauthorizedError } from "@/services/apiError";
import { buscarRodaCrianca, entrarNaRoda, producaoNaRoda, proporNaDupla, responderNaDupla, responderNaRoda, sairDaRoda, tentarNaRoda } from "@/services/roda";
import type { Conquista, ResultadoResposta, ResultadoTentativa } from "@/types/CriancaApp";
import type { ConteudoRoda, DuplaEstado, RodaEstado } from "@/types/Roda";

type Estado =
  | { tipo: "entrando" }
  | { tipo: "sem_roda" }
  | { tipo: "erro" }
  | { tipo: "pronta"; roda: RodaEstado; conteudo: ConteudoRoda; eu: number; dupla: DuplaEstado | null };

const idsDasDuplas = (roda: RodaEstado) => roda.duplas.map((d) => d.id).join(",");

/**
 * A Roda pela criança: entra (na roda da turma, ou pelo código do QR), espera
 * o educador começar e segue a etapa que ele conduz. Em dupla, propõe a
 * resposta e o par confirma; sem dupla, responde sozinha com as peças da turma.
 */
export function RodaCrianca({ codigo }: { codigo: string | null }) {
  const router = useRouter();
  const { crianca, atualizar, recarregar: recarregarPerfil } = useCrianca();
  const reduzido = useMovimentoReduzido();
  const [estado, setEstado] = useState<Estado>({ tipo: "entrando" });
  const [instrucao, setInstrucao] = useState<Trecho>({ texto: COPY.roda.esperando });
  const [lote, setLote] = useState<LoteConquistas | null>(null);
  const [respondendo, setRespondendo] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const pendentes = useRef(new Map<number, (d: DuplaEstado) => void>());
  const ultimaFalada = useRef<number | null>(null);

  useEffect(
    () => () => {
      cancelarNarracao();
      parar();
    },
    [],
  );

  useEffect(() => {
    let ativo = true;

    entrarNaRoda(codigo ?? undefined)
      .then((pacote) => {
        if (ativo) setEstado({ tipo: "pronta", ...pacote });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;

        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        setEstado(erro instanceof ApiError && erro.status === 404 ? { tipo: "sem_roda" } : { tipo: "erro" });
      });

    return () => {
      ativo = false;
    };
  }, [codigo, tentativa, router]);

  const pronta = estado.tipo === "pronta" ? estado : null;
  const roda = pronta?.roda ?? null;
  const conteudo = pronta?.conteudo ?? null;
  const dupla = pronta?.dupla ?? null;
  const eu = pronta?.eu ?? 0;
  const rodaId = roda?.id ?? null;

  /** Snapshot da dupla: guarda e libera quem esperava a resposta do par. */
  const aoDupla = useCallback(
    (nova: DuplaEstado) => {
      setEstado((atual) => (atual.tipo === "pronta" && nova.criancas.some((c) => c.id === atual.eu) ? { ...atual, dupla: nova } : atual));

      const t = nova.tentativa;

      if (t && t.status !== "proposta") {
        const libera = pendentes.current.get(t.id);

        if (libera) {
          pendentes.current.delete(t.id);
          libera(nova);
        }
      }
    },
    [],
  );

  const recarregar = useCallback(async () => {
    if (rodaId === null) return;

    try {
      const pacote = await buscarRodaCrianca(rodaId);

      setEstado((atual) => (atual.tipo === "pronta" ? { ...atual, roda: pacote.roda, conteudo: pacote.conteudo, dupla: pacote.dupla } : atual));

      if (pacote.dupla) aoDupla(pacote.dupla);
    } catch (erro) {
      if (erro instanceof UnauthorizedError) router.replace("/app/entrar");
    }
  }, [rodaId, aoDupla, router]);

  const aoEstado = useCallback(
    (nova: RodaEstado) => {
      let mudouDuplas = false;

      setEstado((atual) => {
        if (atual.tipo !== "pronta") return atual;

        mudouDuplas = idsDasDuplas(atual.roda) !== idsDasDuplas(nova);

        return { ...atual, roda: nova };
      });

      if (mudouDuplas) void recarregar();
    },
    [recarregar],
  );

  useRodaTempoReal({ rodaId, perfil: "crianca", aoEstado, aoDupla, recarregar });

  const etapa = roda?.etapa_atual ?? 1;
  const total = roda?.total_etapas ?? 1;
  const atividade = conteudo && roda?.status === "em_andamento" ? (conteudo.atividades[etapa - 1] ?? null) : null;
  const conquista = roda?.status === "em_andamento" && etapa >= total;
  const parceiro = dupla ? parceiroDe(dupla, eu) : null;
  const duplaAtiva = Boolean(parceiro && atividade && (atividade.tipo === "montar_palavras" || atividade.avaliada));
  const minhaVez = dupla ? ehMinhaVez(dupla, eu) : true;
  const proposta = propostaAberta(dupla);
  const propostaDoPar = duplaAtiva && proposta && proposta.proposta_por !== eu ? descreverResposta(atividade, proposta.resposta) : null;
  const esperandoPar = duplaAtiva && Boolean(proposta && proposta.proposta_por === eu);
  const travada = duplaAtiva && (!minhaVez || esperandoPar);
  const minusculas = crianca?.usa_minusculas ?? true;

  // O resultado da última proposta respondida fica na faixa da dupla para os dois.
  const ultimoResultado = useMemo(() => {
    const t = dupla?.tentativa;

    return t && t.status !== "proposta" ? falaDoResultado(t, atividade?.tipo ?? null) : null;
  }, [dupla, atividade]);

  // Quem confirmou também ouve o resultado e recarrega o conteúdo (metas, Teia);
  // quem propôs já recebe o feedback pela própria atividade.
  useEffect(() => {
    const t = dupla?.tentativa;

    if (!t || t.status === "proposta" || t.proposta_por === eu || ultimaFalada.current === t.id) return;

    ultimaFalada.current = t.id;

    if (t.valida) {
      sons.acerto();
      celebrar(reduzido);
    } else {
      sons.dica();
    }

    void narrar(falaDoResultado(t, atividade?.tipo ?? null));
    void Promise.resolve().then(() => Promise.all([recarregar(), recarregarPerfil()]));
  }, [dupla, eu, atividade, reduzido, recarregar, recarregarPerfil]);

  // Fala fixa das telas sem atividade; na atividade, quem fala é o componente.
  const falaFixa =
    estado.tipo === "sem_roda"
      ? COPY.roda.semRoda
      : estado.tipo === "erro"
        ? COPY.roda.erro
        : roda?.status === "aguardando"
          ? COPY.roda.esperando
          : roda?.status === "encerrada"
            ? COPY.roda.acabou
            : conquista
              ? COPY.roda.conquista
              : null;

  useFalarAoChegar(falaFixa);

  const falaDoTopo: Trecho = falaFixa ? { texto: falaFixa } : instrucao;

  useEffect(() => {
    if (roda?.status === "encerrada") void recarregarPerfil();
  }, [roda?.status, recarregarPerfil]);

  const esperarResposta = useCallback((tentativaId: number) => new Promise<DuplaEstado>((resolve) => pendentes.current.set(tentativaId, resolve)), []);

  const proporEEsperar = useCallback(
    async (resposta: Record<string, unknown>): Promise<DuplaEstado> => {
      if (rodaId === null) throw new Error("Sem roda.");

      const d = await proporNaDupla(rodaId, resposta);
      aoDupla(d);

      if (!d.tentativa || d.tentativa.status !== "proposta") return d;

      return esperarResposta(d.tentativa.id);
    },
    [rodaId, aoDupla, esperarResposta],
  );

  const enviar = useCallback<EnviarResposta>(
    async (ordem, resposta) => {
      if (rodaId === null) throw new Error("Sem roda.");

      if (parceiro && dupla && ehMinhaVez(dupla, eu)) {
        const d = await proporEEsperar(resposta);
        const t = d.tentativa;

        if (!t || t.status === "recusada" || !t.resultado) {
          return respostaDeMudar(parceiro.apelido, String(resposta.item ?? "unico"), { xp_total: crianca?.xp ?? 0, nivel: crianca?.nivel ?? 1 });
        }

        return t.resultado as ResultadoResposta;
      }

      return responderNaRoda(rodaId, ordem, resposta);
    },
    [rodaId, parceiro, dupla, eu, proporEEsperar, crianca?.xp, crianca?.nivel],
  );

  const tentar = useCallback<TentarPalavra>(
    async (silabas) => {
      if (rodaId === null) throw new Error("Sem roda.");

      if (parceiro && dupla && ehMinhaVez(dupla, eu)) {
        const d = await proporEEsperar({ silabas });
        const t = d.tentativa;

        if (!t || t.status === "recusada" || !t.resultado) {
          return tentativaDeMudar(parceiro.apelido, silabas, { xp_total: crianca?.xp ?? 0, teia_total: crianca?.teia_total ?? 0 });
        }

        return t.resultado as ResultadoTentativa;
      }

      return tentarNaRoda(rodaId, silabas);
    },
    [rodaId, parceiro, dupla, eu, proporEEsperar, crianca?.xp, crianca?.teia_total],
  );

  const producao = useCallback<EnviarProducao>((palavras) => (rodaId === null ? Promise.reject(new Error("Sem roda.")) : producaoNaRoda(rodaId, palavras)), [rodaId]);

  async function responderProposta(aceitar: boolean) {
    if (rodaId === null) return;

    setRespondendo(true);

    try {
      aoDupla(await responderNaDupla(rodaId, aceitar));
    } catch {
      void narrar(COPY.missao.falha);
    } finally {
      setRespondendo(false);
    }
  }

  const seguir = useCallback(() => {
    sons.dica();
    void narrar(COPY.roda.seguir);
  }, []);

  const mostrarConquistas = useCallback((conquistas: Conquista[]) => {
    if (conquistas.length === 0) return;

    sons.conquista();
    setLote({ id: Date.now(), conquistas });
  }, []);

  const descobrir = useCallback(() => void recarregar(), [recarregar]);

  const sair = useCallback(async () => {
    if (rodaId !== null && roda?.status !== "encerrada") {
      try {
        await sairDaRoda(rodaId);
      } catch {
        // A saída é só cortesia: o educador vê a presença cair.
      }
    }

    atualizar({});
    router.push("/app");
  }, [rodaId, roda?.status, atualizar, router]);

  if (estado.tipo === "entrando") {
    return <TelaCarregando />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-3 pt-3 pb-2 sm:px-5 lg:flex-nowrap lg:gap-3">
        <div className="order-1 shrink-0">
          <BotaoGrande rotulo={COPY.roda.sair} cor="neutra" tamanho={64} onClick={() => void sair()}>
            <ArrowLeft className="size-9" aria-hidden />
          </BotaoGrande>
        </div>

        <h1 className="order-2 flex min-w-0 items-center gap-2 text-2xl font-black sm:text-3xl">
          <Users className="size-8 shrink-0 text-[var(--c-primaria)]" aria-hidden strokeWidth={2.5} />
          <span className="truncate">{exibir(roda ? `${COPY.roda.titulo}: ${roda.aula.rotulo}` : COPY.roda.titulo, minusculas)}</span>
        </h1>

        {conteudo && roda?.status === "em_andamento" ? (
          <nav aria-label="Trilha da roda" className="order-4 w-full min-w-0 lg:order-3 lg:w-auto lg:flex-1">
            <TrilhaEtapas atividades={conteudo.atividades} etapaAtual={etapa} etapaVisivel={etapa} concluidas={Array.from({ length: etapa - 1 }, (_, i) => i + 1)} aoIr={seguir} />
          </nav>
        ) : null}

        <div className="order-3 ml-auto flex shrink-0 items-center gap-2 lg:order-4 lg:ml-0" onClickCapture={cancelarNarracao}>
          <BotaoOuvir texto={falaDoTopo.texto} audioUrl={falaDoTopo.audio_url ?? null} />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pt-2">
        {estado.tipo === "sem_roda" || estado.tipo === "erro" ? (
          <section aria-label={estado.tipo === "sem_roda" ? "Sem roda" : "Erro"} className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            {estado.tipo === "sem_roda" ? <Orbit className="size-24 text-[var(--c-borda)]" aria-hidden /> : <CloudOff className="size-24 text-[var(--c-borda)]" aria-hidden />}
            <p className="max-w-md text-2xl font-bold">{exibir(estado.tipo === "sem_roda" ? COPY.roda.semRoda : COPY.roda.erro, minusculas)}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={96} className="px-8" onClick={() => router.push("/app")}>
                <ArrowLeft className="size-12" aria-hidden />
              </BotaoGrande>
              <BotaoGrande
                rotulo={COPY.comum.tentarDeNovo}
                cor="primaria"
                tamanho={96}
                destaque
                onClick={() => {
                  setEstado({ tipo: "entrando" });
                  setTentativa((n) => n + 1);
                }}
              >
                <RefreshCw className="size-12" aria-hidden />
              </BotaoGrande>
            </div>
          </section>
        ) : null}

        {roda && roda.status === "aguardando" ? (
          <section aria-label="Esperando" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <Orbit className="size-24 animate-crianca-pulso text-[var(--c-primaria)]" aria-hidden strokeWidth={1.75} />
            <p className="max-w-md text-2xl font-bold">{exibir(COPY.roda.esperando, minusculas)}</p>
            <ParticipantesDaRoda roda={roda} minusculas={minusculas} />
          </section>
        ) : null}

        {roda && roda.status === "encerrada" ? (
          <section aria-label="Roda encerrada" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <Trophy className="size-28 fill-[var(--c-alerta)]/20 text-[var(--c-alerta)]" aria-hidden strokeWidth={1.75} />
            <h2 className="max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight">{exibir(COPY.roda.acabou, minusculas)}</h2>
            <BotaoGrande rotulo={COPY.planeta.voltar} cor="sucesso" tamanho={96} destaque className="px-8" onClick={() => router.push("/app")}>
              <ArrowLeft className="size-12" aria-hidden />
            </BotaoGrande>
          </section>
        ) : null}

        {roda && conquista ? (
          <section aria-label="Conquista" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <Trophy className="size-28 fill-[var(--c-alerta)]/20 text-[var(--c-alerta)]" aria-hidden strokeWidth={1.75} />
            <h2 className="max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight text-[var(--c-alerta)]">{exibir(COPY.missao.concluida, minusculas)}</h2>
            <p className="max-w-md text-2xl font-bold opacity-80">{exibir(COPY.roda.conquista, minusculas)}</p>
            <ParticipantesDaRoda roda={roda} minusculas={minusculas} />
          </section>
        ) : null}

        {roda && conteudo && atividade && !conquista ? (
          <>
            {parceiro && duplaAtiva ? (
              <PainelDupla
                parceiro={parceiro}
                minhaVez={minhaVez}
                propostaDoPar={propostaDoPar}
                esperandoPar={esperandoPar}
                ultimoResultado={ultimoResultado}
                minusculas={minusculas}
                enviando={respondendo}
                aoResponder={(aceitar) => void responderProposta(aceitar)}
              />
            ) : null}

            <div className={travada ? "pointer-events-none flex flex-1 flex-col opacity-50" : "flex flex-1 flex-col"} aria-hidden={travada || undefined}>
              <ProvedorEnvioResposta enviar={enviar} tentar={tentar} producao={producao}>
                <AtividadeAtual
                  key={`${atividade.tipo}-${atividade.ordem}`}
                  aula={conteudo}
                  atividade={atividade}
                  minusculas={minusculas}
                  aoConcluir={seguir}
                  definirInstrucao={setInstrucao}
                  mostrarConquistas={mostrarConquistas}
                  aoDescobrir={descobrir}
                />
              </ProvedorEnvioResposta>
            </div>
          </>
        ) : null}
      </main>

      <AvisoConquistas lote={lote} minusculas={minusculas} aoSumir={() => setLote(null)} />
    </div>
  );
}

/** Quem está na roda (avatar + apelido), na ordem de chegada. */
function ParticipantesDaRoda({ roda, minusculas }: { roda: RodaEstado; minusculas: boolean }) {
  const presentes = roda.participantes.filter((p) => p.presente);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-[var(--c-tinta-suave)]">{exibir(COPY.roda.chegou(presentes.length), minusculas)}</p>
      <ul aria-label="Crianças na roda" className="flex max-w-2xl flex-wrap justify-center gap-3">
        {presentes.map((p) => (
          <li key={p.id} className="flex flex-col items-center gap-1">
            <span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full text-[var(--c-fundo)]"
              style={{ backgroundColor: p.avatar?.cor ?? "var(--c-superficie-2)" }}
            >
              <Icone nome={p.avatar?.icone ?? "user"} className="size-9" strokeWidth={2.25} />
            </span>
            <span className="text-base font-bold">{exibir(p.apelido, minusculas)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
