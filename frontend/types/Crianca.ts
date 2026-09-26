import type { OpcaoVisual } from "./OpcaoVisual";

/**
 * LGPD: a criança tem só apelido, avatar e turma. Nada de nome completo,
 * e-mail ou foto — o backend recusa qualquer outro dado pessoal.
 */
export interface Crianca {
  id: number;
  apelido: string;
  avatar: OpcaoVisual;
  usa_minusculas: boolean;
  turma: { id: number; nome: string; codigo: string };
  responsavel: { id: number; name: string };
  bloqueada_ate: string | null;
  exclusao_solicitada_em: string | null;
  consentimento: { versao_texto: string; aceito_em: string } | null;
  created_at: string;
}

export interface ConsentimentoPayload {
  aceito: true;
  versao_texto: string;
}

export interface CreateCriancaPayload {
  turma_id: number;
  apelido: string;
  avatar_chave: string;
  figura_secreta_chave: string;
  usa_minusculas?: boolean;
  consentimento: ConsentimentoPayload;
}

export interface UpdateCriancaPayload {
  apelido: string;
  avatar_chave: string;
  usa_minusculas: boolean;
  turma_id: number;
}

export interface ListCriancasParams {
  turma_id?: number | null;
}
