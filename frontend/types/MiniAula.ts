import type { OpcaoVisual } from "./OpcaoVisual";

// Mini-aulas e amizades entre turmas (contrato em docs/api-painel.md).

export type StatusMiniAula = "pendente" | "aprovada" | "recusada";

export interface MiniAulaPainel {
  id: number;
  status: StatusMiniAula;
  disciplina: string;
  tipo: string;
  titulo: string;
  /** Config do desafio (formato por tipo em docs/atividades.md); o adulto vê a resposta. */
  config: Record<string, unknown>;
  autor: {
    id: number;
    apelido: string;
    avatar: OpcaoVisual | null;
    turma: { id: number; nome: string } | null;
  } | null;
  aula_origem: { id: number; titulo: string; rotulo: string } | null;
  /** Caminho no backend (`/painel/mini-aulas/{id}/audio`); o player passa pelo proxy. */
  audio_url: string | null;
  duracao_ms: number | null;
  entregas: number;
  respondidas: number;
  motivo_recusa: string | null;
  revisada_por: string | null;
  revisada_em: string | null;
  created_at: string;
}

export type StatusAmizade = "pendente" | "aceita" | "encerrada" | "vencida";

export interface Amizade {
  id: number;
  status: StatusAmizade;
  /** Só para quem gerou, enquanto o convite vale. */
  codigo: string | null;
  turma: { id: number; nome: string } | null;
  turma_amiga: { id: number; nome: string } | null;
  gerada_por_mim: boolean;
  termo_versao: string | null;
  expira_em: string | null;
  aceita_em: string | null;
  encerrada_em: string | null;
  created_at: string;
}

export interface AmizadesResposta {
  termo: { versao: string; texto: string };
  amizades: Amizade[];
}

export interface AceitarAmizadePayload {
  turma_id: number;
  codigo: string;
  termo_aceito: boolean;
}
