/** Origem da palavra no dicionário geral (`cms` = cadastrada pelo painel). */
export type PalavraOrigem = "cms" | (string & {});

export interface Palavra {
  id: number;
  palavra: string;
  palavra_normalizada: string;
  silabas: string[];
  origem: PalavraOrigem;
  aprovada: boolean;
  aprovada_em: string | null;
  created_at: string;
}

export interface ListDicionarioParams {
  busca?: string;
  aprovada?: boolean | null;
}

export interface CreatePalavraPayload {
  palavra: string;
  silabas: string[];
}

export interface UpdatePalavraPayload {
  palavra: string;
  silabas: string[];
  aprovada: boolean;
}

export interface ImportacaoIgnorada {
  linha: string;
  motivo: string;
}

export interface ImportarDicionarioResponse {
  importadas: number;
  ignoradas: ImportacaoIgnorada[];
}
