export type AulaStatus = "rascunho" | "publicada";

/** Fase 1 (caixa alta) e Fase 2. */
export type AulaFase = number;

export interface AulaTotais {
  silabas: number;
  palavras: number;
  paginas: number;
  perguntas: number;
}

export interface AulaResumo {
  id: number;
  slug: string;
  titulo: string;
  fase: AulaFase;
  ordem: number;
  palavra_geradora: string;
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

export interface Aula {
  id: number;
  slug: string;
  titulo: string;
  fase: AulaFase;
  ordem: number;
  status: AulaStatus;
  palavra_geradora: string;
  palavra_imagem_url: string | null;
  palavra_audio_url: string | null;
  pre_requisito_aula_id: number | null;
  criada_por: { id: number; name: string };
  silabas: AulaSilaba[];
  historia_paginas: AulaHistoriaPagina[];
  perguntas: AulaPergunta[];
  palavras: AulaPalavra[];
  created_at: string;
  updated_at: string;
}

export interface CreateAulaPayload {
  titulo: string;
  palavra_geradora: string;
  fase: AulaFase;
}

/**
 * Documento completo do PUT /painel/aulas/{id}. A ordem dos filhos é a
 * posição no array; filhos com `id` são atualizados, sem `id` são criados e
 * os ausentes são removidos pelo backend.
 */
export interface UpdateAulaPayload {
  titulo: string;
  palavra_geradora: string;
  fase: AulaFase;
  pre_requisito_aula_id: number | null;
  silabas: { texto: string; familia: string[] }[];
  historia_paginas: { id?: number; texto: string }[];
  perguntas: { id?: number; texto: string }[];
  palavras: { id?: number; palavra: string; silabas: string[]; destaque: boolean }[];
}

export type AulaMidiaAlvo =
  | "palavra_imagem"
  | "palavra_audio"
  | "pagina_imagem"
  | "pagina_audio"
  | "pergunta_audio"
  | "palavra_dicionario_imagem"
  | "palavra_dicionario_audio";

export interface UploadAulaMidiaPayload {
  alvo: AulaMidiaAlvo;
  /** Id do filho (página, pergunta, palavra); ausente para a palavra geradora. */
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
