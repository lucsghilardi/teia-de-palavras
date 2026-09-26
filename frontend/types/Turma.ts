import type { OpcaoVisual } from "./OpcaoVisual";

export interface Turma {
  id: number;
  nome: string;
  /** Código de 6 caracteres usado para parear o dispositivo da criança. */
  codigo: string;
  ativa: boolean;
  educador: { id: number; name: string };
  total_criancas: number;
  created_at: string;
}

export interface CriancaResumo {
  id: number;
  apelido: string;
  avatar: OpcaoVisual;
  usa_minusculas: boolean;
}

export type TurmaDetalhe = Turma & { criancas: CriancaResumo[] };

export interface CreateTurmaPayload {
  nome: string;
}

export interface UpdateTurmaPayload {
  nome: string;
  ativa: boolean;
}
