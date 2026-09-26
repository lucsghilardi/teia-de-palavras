"use client";

import { CloudOff, RefreshCw, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { CabecalhoEu } from "@/components/crianca/galaxia/cabecalho-eu";
import { CartaoAmigos } from "@/components/crianca/galaxia/cartao-amigos";
import { CartaoMissao } from "@/components/crianca/galaxia/cartao-missao";
import { CartaoRevisao } from "@/components/crianca/galaxia/cartao-revisao";
import { CartaoRoda } from "@/components/crianca/galaxia/cartao-roda";
import { Planeta } from "@/components/crianca/galaxia/planeta";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { COPY } from "@/lib/copy";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { UnauthorizedError } from "@/services/apiError";
import { buscarGalaxia } from "@/services/crianca";
import type { Galaxia as DadosGalaxia, Missao, Planeta as DadosPlaneta } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; galaxia: DadosGalaxia };

/**
 * Início do app da criança: as missões do dia, a Revisão, os quatro planetas
 * e a base dos amigos. O cabeçalho mostra nível e sequência (toque abre "eu").
 */
export function Galaxia() {
  const router = useRouter();
  const { crianca, recarregar, atualizar, sair } = useCrianca();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    buscarGalaxia()
      .then((galaxia) => {
        if (!ativo) return;

        setEstado({ tipo: "pronto", galaxia });
        atualizar({ revisao_devidos: galaxia.revisao.devidos });
        // Voltando de uma missão: XP, nível e sequência podem ter mudado.
        void recarregar();
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
  }, [tentativa, router, recarregar, atualizar]);

  const minusculas = crianca?.usa_minusculas ?? true;
  const galaxia = estado.tipo === "pronto" ? estado.galaxia : null;
  const instrucao = crianca
    ? estado.tipo === "erro"
      ? `${COPY.galaxia.ola(crianca.apelido)} ${COPY.galaxia.erro}`
      : `${COPY.galaxia.ola(crianca.apelido)} ${COPY.galaxia.instrucao}`
    : null;

  useFalarAoChegar(estado.tipo === "carregando" ? null : instrucao);

  const planetaDe = (chave: string) => galaxia?.planetas.find((p) => p.chave === chave) ?? null;

  function abrirMissao(missao: Missao) {
    sons.toque();
    router.push(`/app/missao/${missao.id}`);
  }

  function abrirPlaneta(planeta: DadosPlaneta) {
    router.push(`/app/planeta/${planeta.chave}`);
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <CabecalhoEu crianca={crianca} instrucao={instrucao ?? COPY.galaxia.instrucao} />
      <h1 className="sr-only">{COPY.galaxia.titulo}</h1>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-2 pb-6 sm:px-6">
        {estado.tipo === "carregando" ? <TelaCarregando className="min-h-[50dvh]" /> : null}

        {estado.tipo === "erro" ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6 text-center">
            <CloudOff aria-hidden className="size-24 text-[var(--c-borda)]" />
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

        {galaxia ? (
          <>
            <CartaoRoda minusculas={minusculas} />

            <section aria-label={COPY.galaxia.escolhasDoDia} className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-[var(--c-tinta-suave)]">{exibir(COPY.galaxia.escolhasDoDia, minusculas)}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {galaxia.escolhas_do_dia.map((missao, i) => {
                  const planeta = planetaDe(missao.disciplina);

                  return planeta ? (
                    <li key={missao.id} className="flex animate-crianca-entrar" style={{ animationDelay: `${i * 60}ms` }}>
                      <CartaoMissao missao={missao} planeta={planeta} minusculas={minusculas} onTocar={abrirMissao} />
                    </li>
                  ) : null;
                })}
                <li className="flex animate-crianca-entrar" style={{ animationDelay: "180ms" }}>
                  <CartaoRevisao devidos={galaxia.revisao.devidos} minusculas={minusculas} />
                </li>
              </ul>
            </section>

            <section aria-label={COPY.galaxia.planetas} className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-[var(--c-tinta-suave)]">{exibir(COPY.galaxia.planetas, minusculas)}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {galaxia.planetas.map((planeta, i) => (
                  <li key={planeta.chave} className="flex animate-crianca-entrar" style={{ animationDelay: `${240 + i * 60}ms` }}>
                    <Planeta planeta={planeta} minusculas={minusculas} onTocar={abrirPlaneta} />
                  </li>
                ))}
              </ul>
            </section>

            <CartaoAmigos novas={galaxia.amigos.novas} minusculas={minusculas} />
          </>
        ) : null}
      </div>

      {/* Para adultos: discreto, no rodapé. */}
      <footer className="flex justify-center px-4 pb-4">
        <button
          type="button"
          aria-label="Trocar de criança"
          onClick={() => void sair()}
          className="inline-flex min-h-16 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[var(--c-tinta-suave)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
        >
          <Repeat className="size-4" aria-hidden />
          trocar de criança
        </button>
      </footer>
    </main>
  );
}
