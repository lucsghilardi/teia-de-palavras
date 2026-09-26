import type { Disciplina } from "@/types/CriancaApp";

export type AulaStatus = "rascunho" | "publicada";

/** Fase 1 (caixa alta) e Fase 2. */
export type AulaFase = number;

export interface AulaTotais {
  silabas: number;
  palavras: number;
  paginas: number;
  perguntas: number;
  atividades: number;
}

export interface AulaResumo {
  id: number;
  slug: string;
  disciplina: Disciplina;
  titulo: string;
  /** O que o nó do mapa mostra (palavra geradora em Português). */
  rotulo: string;
  descricao: string | null;
  habilidade_bncc: string | null;
  fase: AulaFase;
  ordem: number;
  palavra_geradora: string | null;
  status: AulaStatus;
  pre_requisito_aula_id: number | null;
  palavra_imagem_url: string | null;
  totais: AulaTotais;
  updated_at: string;
}

export interface AulaFamiliaItem {
  id: number;
  texto: string;
  audio_url: string | null;
}

export interface AulaSilaba {
  id: number;
  texto: string;
  ordem: number;
  audio_url: string | null;
  familia: AulaFamiliaItem[];
}

export interface AulaHistoriaPagina {
  id: number;
  ordem: number;
  texto: string;
  imagem_url: string | null;
  audio_url: string | null;
}

export interface AulaPergunta {
  id: number;
  ordem: number;
  texto: string;
  audio_url: string | null;
}

export interface AulaPalavra {
  id: number;
  palavra: string;
  silabas: string[];
  destaque: boolean;
  imagem_url: string | null;
  audio_url: string | null;
}

/** Uma atividade da missão (docs/atividades.md). `config` depende do tipo. */
export interface AulaAtividade {
  id: number;
  ordem: number;
  tipo: string;
  titulo: string | null;
  instrucao: string | null;
  config: Record<string, unknown>;
  imagem_url: string | null;
  avaliada: boolean;
}

export interface Aula {
  id: number;
  slug: string;
  disciplina: Disciplina;
  titulo: string;
  rotulo: string | null;
  descricao: string | null;
  habilidade_bncc: string | null;
  fase: AulaFase;
  ordem: number;
  status: AulaStatus;
  palavra_geradora: string | null;
  palavra_imagem_url: string | null;
  palavra_audio_url: string | null;
  pre_requisito_aula_id: number | null;
  criada_por: { id: number; name: string } | null;
  silabas: AulaSilaba[];
  historia_paginas: AulaHistoriaPagina[];
  perguntas: AulaPergunta[];
  palavras: AulaPalavra[];
  atividades: AulaAtividade[];
  created_at: string;
  updated_at: string;
}

export interface CreateAulaPayload {
  titulo: string;
  disciplina?: Disciplina;
  /** Obrigatória só em Português. */
  palavra_geradora?: string;
  fase: AulaFase;
  rotulo?: string | null;
  descricao?: string | null;
  habilidade_bncc?: string | null;
}

export interface AtividadePayload {
  id?: number;
  tipo: string;
  titulo?: string | null;
  instrucao?: string | null;
  config?: Record<string, unknown>;
}

/**
 * Documento completo do PUT /painel/aulas/{id}. A ordem dos filhos é a
 * posição no array; filhos com `id` são atualizados, sem `id` são criados e
 * os ausentes são removidos pelo backend. Os campos de Português só vão
 * quando a aula é de Português.
 */
export interface UpdateAulaPayload {
  titulo: string;
  palavra_geradora?: string;
  fase: AulaFase;
  pre_requisito_aula_id: number | null;
  rotulo?: string | null;
  descricao?: string | null;
  habilidade_bncc?: string | null;
  silabas?: { texto: string; familia: string[] }[];
  historia_paginas?: { id?: number; texto: string }[];
  perguntas?: { id?: number; texto: string }[];
  palavras?: { id?: number; palavra: string; silabas: string[]; destaque: boolean }[];
  atividades?: AtividadePayload[];
}

export type AulaMidiaAlvo =
  | "palavra_imagem"
  | "palavra_audio"
  | "pagina_imagem"
  | "pagina_audio"
  | "pergunta_audio"
  | "palavra_dicionario_imagem"
  | "palavra_dicionario_audio"
  | "atividade_imagem";

export interface UploadAulaMidiaPayload {
  alvo: AulaMidiaAlvo;
  /** Id do filho (página, pergunta, palavra, atividade); ausente para a palavra geradora. */
  alvo_id?: number;
  arquivo: File;
}

export interface RemoveAulaMidiaPayload {
  alvo: AulaMidiaAlvo;
  alvo_id?: number;
}

export interface UploadAulaMidiaResponse {
  url: string;
}

export interface ReordenarAulasPayload {
  ordem: number[];
}

export interface SugerirFamiliaResponse {
  familia: string[];
}
