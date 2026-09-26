"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TelaCarregando } from "@/components/crianca/comum/tela-carregando";
import {
  esquecerCodigo,
  normalizarCodigo,
  salvarCodigo,
  useCodigoSalvo,
} from "@/components/crianca/entrada/codigo-salvo";
import { CodigoTurma, mensagemTurma } from "@/components/crianca/entrada/codigo-turma";
import { FiguraSecreta, type MotivoTrava } from "@/components/crianca/entrada/figura-secreta";
import { PedirAdulto } from "@/components/crianca/entrada/pedir-adulto";
import { QuemEVoce, type CriancaEntrada } from "@/components/crianca/entrada/quem-e-voce";
import { buscarTurma } from "@/services/crianca";
import type { TurmaEntrada } from "@/types/CriancaApp";

type Carga = { codigo: string; turma: TurmaEntrada | null; erro: string | null };
type Trava = { motivo: MotivoTrava; mensagem: string; recarregarTurma: boolean };

/**
 * Entrada da criança em 3 passos:
 *  1. código da turma — do QR (`?codigo=`), do que o dispositivo já guardou ou
 *     digitado por um adulto;
 *  2. "Quem é você?" — grade de bichinhos;
 *  3. figura secreta — faz o login e vai para o mapa.
 */
export function EntradaCrianca() {
  const params = useSearchParams();
  const codigoUrl = normalizarCodigo(params.get("codigo") ?? "");
  const salvo = useCodigoSalvo();

  /** Código confirmado pelo adulto nesta visita (vale mais que URL e memória). */
  const [manual, setManual] = useState<string | null>(null);
  /** Depois de "trocar turma", o `?codigo=` da URL deixa de valer. */
  const [ignorarUrl, setIgnorarUrl] = useState(false);
  const [carga, setCarga] = useState<Carga | null>(null);
  const [selecionada, setSelecionada] = useState<CriancaEntrada | null>(null);
  const [trava, setTrava] = useState<Trava | null>(null);

  // undefined = ainda lendo o armazenamento local; null/"" = sem código.
  const codigoAtivo = manual ?? ((ignorarUrl ? "" : codigoUrl) || salvo);
  const codigoCarregado = carga?.codigo ?? null;

  useEffect(() => {
    if (!codigoAtivo || codigoCarregado === codigoAtivo) return;

    let ativo = true;

    buscarTurma(codigoAtivo)
      .then((turma) => {
        if (!ativo) return;

        setCarga({ codigo: codigoAtivo, turma, erro: null });
        salvarCodigo(codigoAtivo);
      })
      .catch((erro: unknown) => {
        if (!ativo) return;

        setCarga({ codigo: codigoAtivo, turma: null, erro: mensagemTurma(erro) });
      });

    return () => {
      ativo = false;
    };
  }, [codigoAtivo, codigoCarregado]);

  function aoEncontrarTurma(codigo: string, turma: TurmaEntrada) {
    setCarga({ codigo, turma, erro: null });
    setManual(codigo);
    setSelecionada(null);
    setTrava(null);
    salvarCodigo(codigo);
  }

  function trocarTurma() {
    setManual(null);
    setIgnorarUrl(true);
    setCarga(null);
    setSelecionada(null);
    setTrava(null);
    esquecerCodigo();

    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function voltarParaBichinhos() {
    if (trava?.recarregarTurma) {
      setCarga(null); // recarrega a lista (alguém saiu da turma)
    }

    setTrava(null);
    setSelecionada(null);
  }

  if (codigoAtivo === undefined) {
    return <TelaCarregando />;
  }

  if (!codigoAtivo) {
    return <CodigoTurma key="sem-codigo" onTurmaEncontrada={aoEncontrarTurma} />;
  }

  if (!carga || carga.codigo !== codigoAtivo) {
    return <TelaCarregando />;
  }

  if (!carga.turma) {
    return (
      <CodigoTurma
        key={`erro-${carga.codigo}`}
        codigoInicial={carga.codigo}
        erroInicial={carga.erro}
        onTurmaEncontrada={aoEncontrarTurma}
      />
    );
  }

  if (trava) {
    return <PedirAdulto motivo={trava.motivo} mensagem={trava.mensagem} onVoltar={voltarParaBichinhos} />;
  }

  if (selecionada) {
    return (
      <FiguraSecreta
        key={selecionada.id}
        codigoTurma={carga.turma.turma.codigo || carga.codigo}
        crianca={selecionada}
        figuras={carga.turma.figuras}
        onVoltar={voltarParaBichinhos}
        onTravar={(motivo, mensagem) => setTrava({ motivo, mensagem, recarregarTurma: false })}
        onNaoEncontrada={(mensagem) => setTrava({ motivo: "adulto", mensagem, recarregarTurma: true })}
      />
    );
  }

  return <QuemEVoce turma={carga.turma} onEscolher={setSelecionada} onTrocarTurma={trocarTurma} />;
}
