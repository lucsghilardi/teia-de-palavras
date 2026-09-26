"use client";

import { ArrowLeft, Flame, RefreshCw, RotateCcw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { AnelNivel } from "@/components/crianca/eu/anel-nivel";
import { Medalhas } from "@/components/crianca/eu/medalhas";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useCrianca } from "@/context/CriancaContext";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { COPY } from "@/lib/copy";
import { progressoDoNivel, textoDaSequencia, textoDoNivel } from "@/lib/crianca/nivel";
import { rotuloRevisao } from "@/lib/crianca/revisao";
import { exibir } from "@/lib/exibir";
import { UnauthorizedError } from "@/services/apiError";
import { buscarMedalhas } from "@/services/crianca";
import type { Medalhas as DadosMedalhas } from "@/types/CriancaApp";

/**
 * A tela "eu" da criança: nível em anel com a barra de XP, sequência de dias,
 * atalho para a Revisão e a grade de medalhas. Só o próprio caminho: nada de
 * ranking nem comparação.
 */
export function PainelEu() {
  const router = useRouter();
  const { crianca, recarregar } = useCrianca();
  const [medalhas, setMedalhas] = useState<DadosMedalhas | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    // XP, nível e revisões podem ter mudado desde a última carga do perfil.
    void recarregar();

    buscarMedalhas()
      .then((dados) => {
        if (ativo) setMedalhas(dados);
      })
      .catch((e: unknown) => {
        if (!ativo) return;

        if (e instanceof UnauthorizedError) {
          router.replace("/app/entrar");

          return;
        }

        setErro(true);
      });

    return () => {
      ativo = false;
    };
  }, [tentativa, recarregar, router]);

  const minusculas = crianca?.usa_minusculas ?? true;
  const nivel = crianca?.nivel ?? 1;
  const xpNoNivel = crianca?.xp_no_nivel ?? 0;
  const xpParaProximo = crianca?.xp_para_proximo ?? null;
  const sequencia = crianca?.sequencia_dias ?? 0;
  const devidos = crianca?.revisao_devidos ?? 0;
  const falaNivel = textoDoNivel(nivel, xpNoNivel, xpParaProximo);
  const falaSequencia = textoDaSequencia(sequencia);
  const instrucao = crianca
    ? erro
      ? `Oi, ${crianca.apelido}! Não consegui abrir as medalhas. Toque no botão para tentar de novo.`
      : `Oi, ${crianca.apelido}! ${falaNivel} ${falaSequencia}`
    : null;

  useFalarAoChegar(instrucao);

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={instrucao ?? "Este é o seu painel."}>
        <BotaoGrande rotulo={COPY.planeta.voltar} cor="neutra" tamanho={64} onClick={() => router.push("/app")}>
          <ArrowLeft className="size-9" aria-hidden />
        </BotaoGrande>
        <h1 className="truncate text-2xl font-black sm:text-3xl">{crianca ? exibir(crianca.apelido, minusculas) : " "}</h1>
      </BarraTopo>

      <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-2 pb-8 sm:px-6">
        <section
          aria-label="Meu nível"
          className="flex w-full max-w-3xl flex-col items-center gap-5 rounded-[2rem] bg-[var(--c-superficie)] p-5 shadow-[0_6px_0_var(--c-borda)] sm:flex-row sm:items-center sm:gap-8"
        >
          <AnelNivel nivel={nivel} progresso={progressoDoNivel(xpNoNivel, xpParaProximo)} avatar={crianca?.avatar} />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
            <p className="text-[clamp(2rem,6vw,3rem)] leading-none font-black text-[var(--c-teia)]">{exibir(`Nível ${nivel}`, minusculas)}</p>

            <div className="w-full max-w-sm">
              <div
                role="progressbar"
                aria-label="Pontos para o próximo nível"
                aria-valuemin={0}
                aria-valuemax={xpParaProximo ?? xpNoNivel}
                aria-valuenow={xpNoNivel}
                className="h-5 w-full overflow-hidden rounded-full bg-[var(--c-borda)]"
              >
                <div
                  className="h-full rounded-full bg-[var(--c-teia)] transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.round(progressoDoNivel(xpNoNivel, xpParaProximo) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xl font-bold opacity-80 sm:text-left">
                {exibir(xpParaProximo === null ? "nível mais alto!" : `${xpNoNivel} de ${xpParaProximo} pontos`, minusculas)}
              </p>
            </div>
          </div>
        </section>

        <ul aria-label="Meus números" className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="flex">
            <BotaoGrande
              rotulo={falaSequencia}
              falaAoTocar={falaSequencia}
              cor="neutra"
              redondo={false}
              tamanho={80}
              className="w-full justify-start gap-4 px-5 text-2xl"
            >
              <Flame className={sequencia > 0 ? "size-11 fill-[var(--c-destaque)] text-[var(--c-destaque)]" : "size-11 text-[var(--c-tinta)]/40"} aria-hidden />
              <span aria-hidden className="flex flex-col items-start leading-tight">
                <span className="text-3xl tabular-nums">{sequencia}</span>
                <span className="text-base font-bold opacity-70">{exibir(sequencia === 1 ? "dia seguido" : "dias seguidos", minusculas)}</span>
              </span>
            </BotaoGrande>
          </li>
          <li className="flex">
            <BotaoGrande
              rotulo={`${crianca?.xp ?? 0} pontos`}
              falaAoTocar={`Você tem ${crianca?.xp ?? 0} pontos.`}
              cor="neutra"
              redondo={false}
              tamanho={80}
              className="w-full justify-start gap-4 px-5 text-2xl"
            >
              <Star className="size-11 fill-[var(--c-sol)] text-[var(--c-sol-sombra)]" aria-hidden />
              <span aria-hidden className="flex flex-col items-start leading-tight">
                <span className="text-3xl tabular-nums">{crianca?.xp ?? 0}</span>
                <span className="text-base font-bold opacity-70">{exibir("pontos", minusculas)}</span>
              </span>
            </BotaoGrande>
          </li>
          <li className="flex">
            <BotaoGrande
              rotulo={rotuloRevisao(devidos)}
              cor={devidos > 0 ? "sucesso" : "neutra"}
              redondo={false}
              tamanho={80}
              destaque={devidos > 0}
              className="w-full justify-start gap-4 px-5 text-2xl"
              onClick={() => router.push("/app/revisao")}
            >
              <RotateCcw className="size-11" aria-hidden strokeWidth={2.5} />
              <span aria-hidden className="flex flex-col items-start leading-tight">
                <span className="text-3xl tabular-nums">{devidos}</span>
                <span className="text-base font-bold opacity-70">{exibir("para revisar", minusculas)}</span>
              </span>
            </BotaoGrande>
          </li>
        </ul>

        {erro ? (
          <BotaoGrande
            rotulo="Tentar de novo"
            cor="primaria"
            tamanho={96}
            destaque
            onClick={() => {
              setErro(false);
              setTentativa((n) => n + 1);
            }}
          >
            <RefreshCw className="size-12" aria-hidden />
          </BotaoGrande>
        ) : (
          <Medalhas dados={medalhas} minusculas={minusculas} />
        )}
      </div>
    </main>
  );
}
