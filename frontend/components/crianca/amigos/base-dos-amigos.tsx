"use client";

import { ArrowLeft, Mic, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CartaoAulaAmigo } from "@/components/crianca/amigos/cartao-aula-amigo";
import { ICONE_REACAO } from "@/components/crianca/amigos/reacoes";
import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { COPY } from "@/lib/copy";
import { contagemDeReacoes, resumoDaMinha } from "@/lib/crianca/amigos";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { UnauthorizedError } from "@/services/apiError";
import { buscarMinhasMiniAulas, buscarMiniAulasRecebidas } from "@/services/crianca";
import type { EntregaMiniAula, MinhaMiniAula } from "@/types/CriancaApp";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; entregas: EntregaMiniAula[]; minhas: MinhaMiniAula[] };

/**
 * Base dos amigos: as mini-aulas recebidas (novas primeiro), o botão de dar
 * uma aula e as próprias aulas com quantos amigos responderam. Amigo = só
 * apelido e avatar; nada de ranking.
 */
export function BaseDosAmigos() {
  const router = useRouter();
  const { crianca } = useCrianca();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    Promise.all([buscarMiniAulasRecebidas(), buscarMinhasMiniAulas()])
      .then(([recebidas, minhas]) => {
        if (ativo) setEstado({ tipo: "pronto", entregas: recebidas.entregas, minhas: minhas.mini_aulas });
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
  }, [tentativa, router]);

  const minusculas = crianca?.usa_minusculas ?? true;
  const instrucao = estado.tipo === "carregando" ? null : estado.tipo === "erro" ? COPY.amigos.erro : COPY.amigos.instrucao;

  useFalarAoChegar(instrucao);

  function abrir(entrega: EntregaMiniAula) {
    sons.toque();
    router.push(`/app/amigos/${entrega.id}`);
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao ?? COPY.amigos.instrucao}>
        <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={64} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <h1 className="flex min-w-0 items-center gap-2 text-2xl font-black sm:text-3xl">
          <Users className="size-8 shrink-0 text-[var(--c-primaria)]" aria-hidden strokeWidth={2.5} />
          <span className="truncate">{exibir(COPY.amigos.titulo, minusculas)}</span>
        </h1>
      </BarraTopo>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-2 pb-8 sm:px-6">
        {estado.tipo === "carregando" ? <TelaCarregando className="min-h-[50dvh]" /> : null}

        {estado.tipo === "erro" ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6">
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

        {estado.tipo === "pronto" ? (
          <>
            <BotaoGrande
              rotulo={COPY.amigos.darAula}
              cor="destaque"
              redondo={false}
              tamanho={88}
              className="w-full justify-start gap-4 px-4 text-left"
              onClick={() => router.push("/app/amigos/nova")}
            >
              <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--c-fundo)]/15">
                <Mic className="size-9" strokeWidth={2.5} />
              </span>
              <span aria-hidden className="text-2xl font-extrabold sm:text-3xl">
                {exibir(COPY.amigos.darAula, minusculas)}
              </span>
            </BotaoGrande>

            <section aria-label={COPY.amigos.recebidas} className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-[var(--c-tinta-suave)]">{exibir(COPY.amigos.recebidas, minusculas)}</h2>
              {estado.entregas.length === 0 ? (
                <p className="rounded-3xl bg-[var(--c-superficie)] px-5 py-6 text-center text-xl font-bold text-[var(--c-tinta-suave)]">
                  {exibir(COPY.amigos.semAulas, minusculas)}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {estado.entregas.map((entrega, i) => (
                    <li key={entrega.id} className="flex animate-crianca-entrar" style={{ animationDelay: `${i * 50}ms` }}>
                      <CartaoAulaAmigo entrega={entrega} minusculas={minusculas} onTocar={abrir} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label={COPY.amigos.minhas} className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold text-[var(--c-tinta-suave)]">{exibir(COPY.amigos.minhas, minusculas)}</h2>
              {estado.minhas.length === 0 ? (
                <p className="rounded-3xl bg-[var(--c-superficie)] px-5 py-6 text-center text-xl font-bold text-[var(--c-tinta-suave)]">
                  {exibir(COPY.amigos.semMinhas, minusculas)}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {estado.minhas.map((mini) => (
                    <li key={mini.id} className="flex flex-col gap-1 rounded-3xl bg-[var(--c-superficie)] px-5 py-4 ring-2 ring-inset ring-[var(--c-borda)]">
                      <span className="text-xl font-extrabold">{exibir(mini.titulo, minusculas)}</span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-bold text-[var(--c-tinta-suave)]">
                        <span>{exibir(resumoDaMinha(mini), minusculas)}</span>
                        {contagemDeReacoes(mini).map(({ reacao, total }) => {
                          const Icone = ICONE_REACAO[reacao];

                          return (
                            <span key={reacao} className="inline-flex items-center gap-1" aria-label={`${total} ${COPY.amigos.reacoes[reacao]}`}>
                              <Icone className="size-5" aria-hidden />
                              <span aria-hidden>{total}</span>
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
