"use client";

import { Conversa } from "@/components/crianca/atividades/portugues/conversa";
import { Ficha } from "@/components/crianca/atividades/portugues/ficha";
import { Frase } from "@/components/crianca/atividades/portugues/frase";
import { Historia } from "@/components/crianca/atividades/portugues/historia";
import { MontarPalavras } from "@/components/crianca/atividades/portugues/montar-palavras";
import { Palavra } from "@/components/crianca/atividades/portugues/palavra";
import { Palmas } from "@/components/crianca/atividades/portugues/palmas";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import type { TipoAtividade } from "@/types/CriancaApp";

/**
 * Registro dos tipos de atividade: o `tipo` que vem da API escolhe o
 * componente. Tipo novo = avaliador no backend + um `case` aqui (o switch
 * mantém o tipo estreito e deixa o TypeScript apontar o que faltou).
 */
export function AtividadeAtual(props: PropsAtividade) {
  const { atividade, ...resto } = props;

  switch (atividade.tipo) {
    case "historia":
      return <Historia {...resto} atividade={atividade} />;
    case "conversa":
      return <Conversa {...resto} atividade={atividade} />;
    case "palavra":
      return <Palavra {...resto} atividade={atividade} />;
    case "palmas":
      return <Palmas {...resto} atividade={atividade} />;
    case "ficha":
      return <Ficha {...resto} atividade={atividade} />;
    case "montar_palavras":
      return <MontarPalavras {...resto} atividade={atividade} />;
    case "frase":
      return <Frase {...resto} atividade={atividade} />;
  }
}

export const ICONE_TIPO: Record<TipoAtividade | "conquista", string> = {
  historia: "📖",
  conversa: "💬",
  palavra: "🕸️",
  palmas: "👏",
  ficha: "🧩",
  montar_palavras: "🛠️",
  frase: "✏️",
  conquista: "🏆",
};

/** Nome falado ao tocar no ícone da etapa que já está na tela. */
export const NOME_FALADO_TIPO: Record<TipoAtividade | "conquista", string> = {
  historia: "A história da missão",
  conversa: "Hora de conversar",
  palavra: "A palavra da missão",
  palmas: "Palmas",
  ficha: "Ficha de descoberta",
  montar_palavras: "Criar palavras",
  frase: "Fazer uma frase",
  conquista: "Conquista",
};
