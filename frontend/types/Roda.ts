// A Roda (modo turma ao vivo) — espelha docs/api-roda.md.
import type { AulaCrianca, Conquista, Disciplina, ResultadoResposta, ResultadoTentativa } from "@/types/CriancaApp";
import type { OpcaoVisual } from "@/types/OpcaoVisual";

export type StatusRoda = "aguardando" | "em_andamento" | "encerrada";

export type CriancaNaRoda = { id: number; apelido: string; avatar: OpcaoVisual | null };

export type ParticipanteRoda = CriancaNaRoda & { presente: boolean };

export type RodaEstado = {
  id: number;
  codigo: string;
  status: StatusRoda;
  /** 1..N+1 (N+1 é a conquista), conduzida pelo educador. */
  etapa_atual: number;
  total_etapas: number;
  estado: { pagina: number; item: number };
  aula: {
    id: number;
    titulo: string;
    rotulo: string;
    disciplina: Disciplina;
    palavra_geradora: string | null;
    total_atividades: number;
  };
  turma: { id: number; nome: string };
  participantes: ParticipanteRoda[];
  duplas: { id: number; crianca_a_id: number; crianca_b_id: number }[];
  iniciada_em: string | null;
  encerrada_em: string | null;
  created_at: string;
};

export type StatusTentativaDupla = "proposta" | "confirmada" | "recusada";

export type TentativaDupla = {
  id: number;
  atividade_ordem: number;
  /** O corpo que a criança propôs (ex.: { silabas: [...] } ou { item, opcao }). */
  resposta: Record<string, unknown>;
  proposta_por: number;
  status: StatusTentativaDupla;
  valida: boolean | null;
  palavra: string | null;
  dica: string | null;
  /** Avaliação para quem propôs (ResultadoTentativa em montar_palavras, ResultadoResposta nas avaliadas). */
  resultado: ResultadoResposta | ResultadoTentativa | null;
};

export type DuplaEstado = {
  id: number;
  roda_id: number;
  /** [a, b] */
  criancas: CriancaNaRoda[];
  /** Quem propõe agora. */
  vez_de: number;
  tentativa: TentativaDupla | null;
  /** Palavras que a dupla descobriu nesta roda. */
  palavras: { palavra: string; audio_url: string | null }[];
};

/** Conteúdo da missão da roda: mesmo formato da aula individual. */
export type ConteudoRoda = AulaCrianca;

export type RodaAberta = {
  id: number;
  codigo: string;
  status: StatusRoda;
  aula: { id: number; titulo: string; rotulo: string; palavra_geradora: string | null };
  turma: { id: number; nome: string };
};

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
  | { acao: "ir_etapa" | "pagina" | "item"; valor: number };

/** Membro do canal de presença `presence-roda.{id}`. */
export type MembroRoda =
  | { id: string; tipo: "educador"; nome: string }
  | { id: string; tipo: "crianca"; crianca_id: number; apelido: string; avatar: OpcaoVisual | null };

export type { Conquista };
