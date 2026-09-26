"use client";

import { ArrowLeft, Mic, RefreshCw, Shuffle, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Gravador } from "@/components/crianca/amigos/gravador";
import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { extensaoDoTipo, type Gravacao } from "@/hooks/use-gravador";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { ApiError, UnauthorizedError } from "@/services/apiError";
import { buscarGalaxia, buscarModelosMiniAula, enviarMiniAula } from "@/services/crianca";
import type { ModeloMiniAula, ModelosMiniAula, Planeta } from "@/types/CriancaApp";

type Carga<T> = { chave: string; dados: T | null; erro: boolean };

const TITULO = "Dar uma aula";

/**
 * Dar uma aula em quatro toques: (missão →) desafio → gravar → enviar.
 * A criança nunca digita: escolhe um dos modelos gerados da missão e grava
 * a voz. A aula só circula depois que um adulto aprova.
 */
export function NovaMiniAula() {
  const router = useRouter();
  const parametros = useSearchParams();
  const { crianca } = useCrianca();
  const daUrl = Number(parametros.get("aula"));
  const [aulaId, setAulaId] = useState<number | null>(Number.isInteger(daUrl) && daUrl > 0 ? daUrl : null);
  const [semente, setSemente] = useState(0);
  const [planetas, setPlanetas] = useState<Carga<Planeta[]> | null>(null);
  const [modelos, setModelos] = useState<Carga<ModelosMiniAula> | null>(null);
  const [modelo, setModelo] = useState<ModeloMiniAula | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [instrucaoGravador, setInstrucaoGravador] = useState<string>(COPY.amigos.gravarInstrucao);
  const [tentativa, setTentativa] = useState(0);

  const minusculas = crianca?.usa_minusculas ?? true;
  const chaveModelos = aulaId === null ? null : `${aulaId}:${semente}`;

  // Sem missão na URL: escolhe entre a próxima missão de cada planeta.
  useEffect(() => {
    if (aulaId !== null) return;

    let ativo = true;

    buscarGalaxia()
      .then((g) => {
        if (ativo) setPlanetas({ chave: "galaxia", dados: g.planetas.filter((p) => p.proxima !== null), erro: false });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;

        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        setPlanetas({ chave: "galaxia", dados: null, erro: true });
      });

    return () => {
      ativo = false;
    };
  }, [aulaId, tentativa, router]);

  useEffect(() => {
    if (aulaId === null || chaveModelos === null) return;

    let ativo = true;

    buscarModelosMiniAula(aulaId, semente)
      .then((dados) => {
        if (ativo) setModelos({ chave: chaveModelos, dados, erro: false });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;

        if (erro instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        setModelos({ chave: chaveModelos, dados: null, erro: true });
      });

    return () => {
      ativo = false;
    };
  }, [aulaId, semente, chaveModelos, tentativa, router]);

  const dadosPlanetas = planetas?.chave === "galaxia" ? planetas : null;
  const dadosModelos = modelos?.chave === chaveModelos ? modelos : null;
  const lista = dadosModelos?.dados?.modelos ?? [];
  const passo = enviada ? "enviada" : modelo ? "gravar" : aulaId === null ? "missao" : "modelos";
  const carregando = passo === "missao" ? dadosPlanetas === null : passo === "modelos" ? dadosModelos === null : false;
  const erro = passo === "missao" ? (dadosPlanetas?.erro ?? false) : passo === "modelos" ? (dadosModelos?.erro ?? false) : false;

  let instrucao: string | null = null;

  if (erro) instrucao = COPY.amigos.erro;
  else if (passo === "missao" && !carregando) instrucao = COPY.amigos.escolherMissao;
  else if (passo === "modelos" && !carregando) instrucao = lista.length === 0 ? COPY.amigos.semModelos : COPY.amigos.escolherModelo;
  else if (passo === "gravar") instrucao = instrucaoGravador;
  else if (passo === "enviada") instrucao = `${COPY.amigos.enviada} ${COPY.amigos.enviadaDetalhe}`;

  useFalarAoChegar(instrucao);

  const definirInstrucao = useCallback((texto: string) => setInstrucaoGravador(texto), []);

  async function enviar(gravacao: Gravacao) {
    if (!modelo || aulaId === null) return;

    setEnviando(true);
    setErroEnvio(null);

    try {
      const dados = new FormData();
      dados.append("aula_id", String(aulaId));
      dados.append("modelo", modelo.chave);
      dados.append("semente", String(semente));
      dados.append("duracao_ms", String(gravacao.duracaoMs));
      dados.append("audio", gravacao.blob, `aula.${extensaoDoTipo(gravacao.tipo)}`);

      const resposta = await enviarMiniAula(dados);
      sons.conquista();
      setEnviada(resposta.mensagem);
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/app/entrar");

        return;
      }

      const mensagem = e instanceof ApiError ? e.message : COPY.missao.falha;
      setErroEnvio(mensagem);
      void falar(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  function voltar() {
    if (passo === "gravar") {
      setModelo(null);

      return;
    }

    router.push("/app/amigos");
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao ?? COPY.amigos.escolherModelo}>
        <BotaoGrande rotulo={passo === "gravar" ? COPY.comum.voltar : COPY.amigos.voltar} cor="neutra" tamanho={64} onClick={voltar}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <h1 className="flex min-w-0 items-center gap-2 text-2xl font-black sm:text-3xl">
          <Mic className="size-8 shrink-0 text-[var(--c-destaque)]" aria-hidden strokeWidth={2.5} />
          <span className="truncate">{exibir(TITULO, minusculas)}</span>
        </h1>
      </BarraTopo>

      {carregando ? <TelaCarregando className="min-h-[50dvh]" /> : null}

      {erro ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <BotaoGrande
            rotulo={COPY.comum.tentarDeNovo}
            cor="primaria"
            tamanho={96}
            destaque
            onClick={() => {
              setPlanetas(null);
              setModelos(null);
              setTentativa((n) => n + 1);
            }}
          >
            <RefreshCw className="size-12" aria-hidden />
          </BotaoGrande>
        </div>
      ) : null}

      {passo === "missao" && dadosPlanetas?.dados ? (
        <section aria-label={COPY.amigos.escolherMissao} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-2 pb-8 sm:px-6">
          <h2 className="text-center text-[clamp(1.5rem,4.5vw,2.25rem)] font-black leading-tight">{exibir(COPY.amigos.escolherMissao, minusculas)}</h2>
          <ul aria-label="Missões" className="flex flex-col gap-3">
            {dadosPlanetas.dados.map((planeta, i) => (
              <li key={planeta.chave} className="flex animate-crianca-entrar" style={{ animationDelay: `${i * 60}ms` }}>
                <BotaoGrande
                  rotulo={`${planeta.nome}: ${planeta.proxima?.rotulo ?? ""}`}
                  cor="neutra"
                  redondo={false}
                  tamanho={88}
                  className="w-full justify-start gap-4 px-4 text-left"
                  onClick={() => {
                    if (planeta.proxima) setAulaId(planeta.proxima.id);
                  }}
                >
                  <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]" style={{ backgroundColor: planeta.cor }}>
                    <Icone nome={planeta.icone} className="size-9" strokeWidth={2.25} />
                  </span>
                  <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-xl font-extrabold sm:text-2xl">{exibir(planeta.proxima?.rotulo ?? "", minusculas)}</span>
                    <span className="truncate text-base font-bold text-[var(--c-tinta-suave)]">{exibir(planeta.nome, minusculas)}</span>
                  </span>
                </BotaoGrande>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {passo === "modelos" && dadosModelos?.dados ? (
        <section aria-label="Desafio" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-2 pb-8 sm:px-6">
          <h2 className="text-center text-[clamp(1.5rem,4.5vw,2.25rem)] font-black leading-tight">
            {exibir(lista.length === 0 ? COPY.amigos.semModelos : COPY.amigos.escolherModelo, minusculas)}
          </h2>
          <p className="text-center text-lg font-bold text-[var(--c-tinta-suave)]">{exibir(dadosModelos.dados.aula.rotulo, minusculas)}</p>

          {lista.length > 0 ? (
            <ul aria-label="Desafios" className="flex flex-col gap-3">
              {lista.map((m, i) => (
                <li key={m.chave} className="flex animate-crianca-entrar" style={{ animationDelay: `${i * 60}ms` }}>
                  <BotaoGrande
                    rotulo={m.titulo}
                    cor="neutra"
                    redondo={false}
                    tamanho={88}
                    className="w-full justify-start px-5 text-left text-xl sm:text-2xl"
                    onClick={() => setModelo(m)}
                  >
                    {exibir(m.titulo, minusculas)}
                  </BotaoGrande>
                </li>
              ))}
            </ul>
          ) : null}

          {lista.length > 0 ? (
            <BotaoGrande rotulo={COPY.amigos.outro} cor="primaria" tamanho={80} className="mx-auto px-8" onClick={() => setSemente((s) => s + 1)}>
              <Shuffle className="size-10" aria-hidden />
              <span aria-hidden>{exibir(COPY.amigos.outro, minusculas)}</span>
            </BotaoGrande>
          ) : null}
        </section>
      ) : null}

      {passo === "gravar" && modelo && dadosModelos?.dados ? (
        <>
          <Gravador
            titulo={modelo.titulo}
            fala={modelo.fala}
            limiteSegundos={dadosModelos.dados.limite_segundos}
            enviando={enviando}
            minusculas={minusculas}
            aoEnviar={(g) => void enviar(g)}
            definirInstrucao={definirInstrucao}
          />
          {erroEnvio ? (
            <p role="status" className="px-4 pb-6 text-center text-xl font-bold text-[var(--c-alerta)]">
              {exibir(erroEnvio, minusculas)}
            </p>
          ) : null}
        </>
      ) : null}

      {passo === "enviada" ? (
        <section aria-label="Aula enviada" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 text-center">
          <Users className="size-28 text-[var(--c-sucesso)]" aria-hidden strokeWidth={2} />
          <h2 className="max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-black leading-tight">{exibir(COPY.amigos.enviada, minusculas)}</h2>
          <p className="max-w-md text-2xl font-bold opacity-80">{exibir(COPY.amigos.enviadaDetalhe, minusculas)}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <BotaoGrande rotulo={COPY.amigos.voltar} cor="sucesso" tamanho={96} destaque className="px-8" onClick={() => router.push("/app/amigos")}>
              <Users className="size-12" aria-hidden />
            </BotaoGrande>
            <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={96} className="px-8" onClick={() => router.push("/app")}>
              <ArrowLeft className="size-12" aria-hidden />
            </BotaoGrande>
          </div>
        </section>
      ) : null}
    </main>
  );
}
