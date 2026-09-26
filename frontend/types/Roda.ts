// Modo turma (Roda) — espelha docs/api-roda.md.
import type { AulaCrianca, Conquista } from "@/types/CriancaApp";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

export type StatusRoda = "aguardando" | "em_andamento" | "encerrada";

export type CriancaNaRoda = { id: number; apelido: string; avatar: OpcaoVisual | null };

export type RodaEstado = {
  id: number;
  codigo: string;
  status: StatusRoda;
  etapa_atual: number;
  estado: { pagina: number; pergunta: number };
  crianca_mestre_id: number | null;
  aula: { id: number; titulo: string; palavra_geradora: string };
  turma: { id: number; nome: string };
  participantes: CriancaNaRoda[];
  duplas: { id: number; crianca_a_id: number; crianca_b_id: number }[];
};

export type DuplaEstado = {
  id: number;
  roda_id: number;
  criancas: CriancaNaRoda[];
  vez_de: number;
  tentativa: null | {
    id: number;
    silabas: string[];
    proposta_por: number;
    status: "proposta" | "confirmada" | "recusada";
    valida: boolean | null;
    palavra: string | null;
    dica: string | null;
  };
  palavras: { palavra: string; audio_url: string | null }[];
};

/** Conteúdo da missão da roda: mesmo formato da aula individual. */
export type ConteudoRoda = AulaCrianca;

export type RodaPainel = {
  roda: RodaEstado;
  conteudo: ConteudoRoda;
  criancas_da_turma: CriancaNaRoda[];
  duplas: DuplaEstado[];
};

export type RodaCrianca = {
  roda: RodaEstado;
  conteudo: ConteudoRoda;
  eu: number;
  dupla: DuplaEstado | null;
};

export type ComandoRoda =
  | { acao: "iniciar" | "avancar" | "voltar" | "encerrar" }
  | { acao: "ir_etapa" | "pagina" | "pergunta"; valor: number }
  | { acao: "mestre"; valor: number | null };

/** Membro do canal de presença `presence-roda.{id}`. */
export type MembroRoda =
  | { id: string; tipo: "educador"; nome: string }
  | { id: string; tipo: "crianca"; crianca_id: number; apelido: string; emoji: string | null };

export type { Conquista };
