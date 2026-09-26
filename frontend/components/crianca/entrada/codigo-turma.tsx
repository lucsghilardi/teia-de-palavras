"use client";

import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";

import { BarraTopo } from "@/components/crianca/comum/barra-topo";
import { normalizarCodigo } from "@/components/crianca/entrada/codigo-salvo";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { useFalarAoChegar } from "@/hooks/use-falar-ao-chegar";
import { falar } from "@/lib/fala";
import { sons } from "@/lib/sons";
import { ApiError } from "@/services/apiError";
import { buscarTurma } from "@/services/crianca";
import type { TurmaEntrada } from "@/types/CriancaApp";

const TAMANHO_CODIGO = 6;
const INSTRUCAO = "Peça para um adulto digitar o código da turma.";

/** Mensagem gentil (e falável) para uma falha ao buscar a turma. */
export function mensagemTurma(erro: unknown): string {
  if (erro instanceof ApiError && erro.status === 404) {
    return erro.message || "Não achei essa turma. Confira o código com um adulto.";
  }

  if (erro instanceof ApiError && erro.status === 429) {
    return "Muitas tentativas seguidas. Espere um minutinho e tente de novo.";
  }

  return "Não consegui falar com a escola agora. Confira a internet e tente de novo.";
}

/**
 * Passo de ADULTO: parear o dispositivo digitando o código de 6 caracteres da
 * turma (o mesmo do QR no painel do educador). Texto legível, normal.
 */
export function CodigoTurma({
  codigoInicial = "",
  erroInicial = null,
  onTurmaEncontrada,
}: {
  codigoInicial?: string;
  erroInicial?: string | null;
  onTurmaEncontrada: (codigo: string, turma: TurmaEntrada) => void;
}) {
  const idCampo = useId();
  const idAjuda = useId();
  const [valor, setValor] = useState(() => normalizarCodigo(codigoInicial).slice(0, TAMANHO_CODIGO));
  const [erro, setErro] = useState<string | null>(erroInicial);
  const [enviando, setEnviando] = useState(false);

  useFalarAoChegar(erroInicial ? `${erroInicial} ${INSTRUCAO}` : INSTRUCAO);

  const completo = valor.length === TAMANHO_CODIGO;

  async function confirmar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (enviando) return;

    if (!completo) {
      const aviso = "O código tem 6 letras e números.";
      setErro(aviso);
      sons.dica();
      void falar(aviso);

      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const turma = await buscarTurma(valor);
      onTurmaEncontrada(valor, turma);
    } catch (falha) {
      const mensagem = mensagemTurma(falha);
      setErro(mensagem);
      setEnviando(false);
      sons.dica();
      void falar(mensagem);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <BarraTopo instrucao={INSTRUCAO} />

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center">
        <span aria-hidden className="text-7xl sm:text-8xl">
          🧑‍🏫
        </span>

        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
          Peça para um adulto digitar o código da turma
        </h1>

        <form onSubmit={confirmar} className="flex w-full flex-col items-center gap-5" noValidate>
          <label htmlFor={idCampo} className="sr-only">
            Código da turma
          </label>
          <input
            id={idCampo}
            name="codigo"
            aria-label="Código da turma"
            aria-describedby={idAjuda}
            aria-invalid={erro ? true : undefined}
            value={valor}
            onChange={(e) => {
              setValor(normalizarCodigo(e.target.value).slice(0, TAMANHO_CODIGO));

              if (erro) setErro(null);
            }}
            placeholder="ABC123"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="h-24 w-full max-w-sm rounded-3xl border-4 border-[var(--c-borda)] bg-white px-4 text-center font-mono text-5xl font-black tracking-[0.3em] uppercase text-[var(--c-tinta)] placeholder:text-[var(--c-borda)] focus:border-[var(--c-ceu)] focus:outline-none sm:text-6xl"
          />

          <p id={idAjuda} className="text-base font-semibold text-[color-mix(in_srgb,var(--c-tinta)_65%,transparent)]">
            6 letras e números, como aparece no painel da turma.
          </p>

          {erro ? (
            <p role="alert" className="w-full max-w-sm rounded-2xl bg-[#FFE3D6] px-4 py-3 text-lg font-bold text-[#7A2E12]">
              {erro}
            </p>
          ) : null}

          <BotaoGrande
            type="submit"
            rotulo="Confirmar código"
            cor="grama"
            redondo={false}
            tamanho={72}
            disabled={enviando}
            destaque={completo && !enviando}
            className="w-full max-w-sm"
          >
            {enviando ? "Procurando…" : "Entrar"}
            <ArrowRight className="size-8" aria-hidden />
          </BotaoGrande>
        </form>
      </div>
    </main>
  );
}
