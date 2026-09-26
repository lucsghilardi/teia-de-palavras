"use client";

import {
  Blocks,
  BookOpen,
  Calculator,
  CheckCheck,
  Coins,
  Ear,
  Hand,
  Hash,
  Hourglass,
  Link,
  ListChecks,
  ListOrdered,
  MapPinned,
  MessageCircle,
  Pencil,
  Puzzle,
  SpellCheck,
  Trophy,
  Type,
  type LucideIcon,
} from "lucide-react";

import { Contar } from "@/components/crianca/atividades/genericas/contar";
import { Dinheiro } from "@/components/crianca/atividades/genericas/dinheiro";
import { Ditado } from "@/components/crianca/atividades/genericas/ditado";
import { Escolha } from "@/components/crianca/atividades/genericas/escolha";
import { EscolherSilaba } from "@/components/crianca/atividades/genericas/escolher-silaba";
import { MapaPontos } from "@/components/crianca/atividades/genericas/mapa-pontos";
import { Ordenar } from "@/components/crianca/atividades/genericas/ordenar";
import { Parear } from "@/components/crianca/atividades/genericas/parear";
import { SomarSubtrair } from "@/components/crianca/atividades/genericas/somar-subtrair";
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
    case "escolha":
    case "verdadeiro_falso":
      return <Escolha {...resto} atividade={atividade} />;
    case "ordenar":
    case "linha_do_tempo":
      return <Ordenar {...resto} atividade={atividade} />;
    case "parear":
      return <Parear {...resto} atividade={atividade} />;
    case "contar":
      return <Contar {...resto} atividade={atividade} />;
    case "somar_subtrair":
      return <SomarSubtrair {...resto} atividade={atividade} />;
    case "escolher_silaba":
      return <EscolherSilaba {...resto} atividade={atividade} />;
    case "dinheiro":
      return <Dinheiro {...resto} atividade={atividade} />;
    case "mapa_pontos":
      return <MapaPontos {...resto} atividade={atividade} />;
    case "ditado":
      return <Ditado {...resto} atividade={atividade} />;
  }
}

/** Ícone (lucide) de cada tipo na trilha da missão. */
export const ICONE_TIPO: Record<TipoAtividade | "conquista", LucideIcon> = {
  historia: BookOpen,
  conversa: MessageCircle,
  palavra: Type,
  palmas: Hand,
  ficha: Puzzle,
  montar_palavras: Blocks,
  frase: Pencil,
  escolha: ListChecks,
  verdadeiro_falso: CheckCheck,
  ordenar: ListOrdered,
  linha_do_tempo: Hourglass,
  parear: Link,
  contar: Hash,
  somar_subtrair: Calculator,
  escolher_silaba: SpellCheck,
  dinheiro: Coins,
  mapa_pontos: MapPinned,
  ditado: Ear,
  conquista: Trophy,
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
  escolha: "Escolher a resposta",
  verdadeiro_falso: "Verdadeiro ou falso",
  ordenar: "Colocar em ordem",
  linha_do_tempo: "Linha do tempo",
  parear: "Ligar os pares",
  contar: "Contar",
  somar_subtrair: "Somar e subtrair",
  escolher_silaba: "Escolher a sílaba",
  dinheiro: "Pagar com moedas e notas",
  mapa_pontos: "Achar no mapa",
  ditado: "Ditado",
  conquista: "Conquista",
};
