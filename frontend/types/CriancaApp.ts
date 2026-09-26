// Tipos do app da criança — espelham docs/api-crianca.md.
import type { OpcaoVisual } from "@/types/OpcaoVisual";

export type Conquista = {
  chave: string;
  titulo: string;
  descricao: string;
  emoji: string;
};

export type TurmaEntrada = {
  turma: { nome: string; codigo: string };
  criancas: { id: number; apelido: string; avatar: OpcaoVisual }[];
  figuras: OpcaoVisual[];
};

export type Eu = {
  id: number;
  apelido: string;
  avatar: OpcaoVisual;
  usa_minusculas: boolean;
  turma: { id: number; nome: string };
  estrelas: number;
  sequencia_dias: number;
  teia_total: number;
  config: { heroi_nome: string; fabrica_nome: string; minutos_pausa: number };
};

export type Pulso = { sessao_id: number; minutos: number; sugerir_pausa: boolean };

export type StatusMissao = "disponivel" | "em_andamento" | "concluida" | "bloqueada";

/** Disciplinas (os "planetas"); lista em lib/disciplinas.ts. */
export type Disciplina = "portugues" | "matematica" | "geografia" | "historia";

export type Missao = {
  id: number;
  titulo: string;
  descricao: string | null;
  disciplina: Disciplina;
  /** O que o nó do mapa mostra (palavra geradora em Português). */
  rotulo: string;
  fase: number;
  ordem: number;
  palavra_geradora: string | null;
  palavra_imagem_url: string | null;
  status: StatusMissao;
  /** 1..N+1 (N atividades; N+1 é a conquista) ou null quando não começou. */
  etapa_atual: number | null;
  total_atividades: number;
};

export type ItemFalado = { texto: string; audio_url: string | null };

// ---------- Atividades ----------

/** Tipos registrados no backend (RegistroAtividades) e no front (atividades/registro.ts). */
export type TipoAtividade = "historia" | "conversa" | "palavra" | "palmas" | "ficha" | "montar_palavras" | "frase";

type AtividadeBase = {
  /** Posição na missão, a partir de 1. */
  ordem: number;
  tipo: TipoAtividade;
  titulo: string | null;
  instrucao: string | null;
  imagem_url: string | null;
  /** Pede resposta da criança (POST .../atividades/{ordem}/responder). */
  avaliada: boolean;
};

export type PaginaHistoria = { texto: string; imagem_url: string | null; audio_url: string | null };

export type Meta = {
  palavra: string;
  silabas: string[];
  imagem_url: string | null;
  audio_url: string | null;
  encontrada: boolean;
};

export type PecaSilaba = ItemFalado & { da_aula: boolean };

export type PalavraDaTeia = { palavra: string; audio_url: string | null };

export type AtividadeHistoria = AtividadeBase & { tipo: "historia"; paginas: PaginaHistoria[] };
export type AtividadeConversa = AtividadeBase & { tipo: "conversa"; perguntas: ItemFalado[] };
export type AtividadePalavra = AtividadeBase & { tipo: "palavra"; palavra: string; audio_url: string | null };
export type AtividadePalmas = AtividadeBase & { tipo: "palmas"; silabas: ItemFalado[] };
export type AtividadeFicha = AtividadeBase & { tipo: "ficha"; linhas: { silaba: string; membros: ItemFalado[] }[] };
export type AtividadeMontarPalavras = AtividadeBase & {
  tipo: "montar_palavras";
  pecas: PecaSilaba[];
  metas: Meta[];
  teia_total: number;
  minimo_palavras: number;
};
export type AtividadeFrase = AtividadeBase & {
  tipo: "frase";
  teia: PalavraDaTeia[];
  palavrinhas: string[];
  minimo: number;
};

export type Atividade =
  | AtividadeHistoria
  | AtividadeConversa
  | AtividadePalavra
  | AtividadePalmas
  | AtividadeFicha
  | AtividadeMontarPalavras
  | AtividadeFrase;

export type AulaCrianca = {
  id: number;
  titulo: string;
  descricao: string | null;
  disciplina: Disciplina;
  rotulo: string;
  fase: number;
  palavra_geradora: string | null;
  palavra_imagem_url: string | null;
  palavra_audio_url: string | null;
  status: StatusMissao;
  /** 1..N+1; concluída continua N+1 (pode rever). */
  etapa_atual: number;
  /** N */
  total_atividades: number;
  atividades: Atividade[];
};

/** Resposta genérica de POST .../atividades/{ordem}/responder. */
export type ResultadoResposta = {
  correta: boolean;
  item: string;
  mensagem: string;
  dica: string | null;
  resposta_correta: unknown;
  xp_ganho: number;
  extra: Record<string, unknown>;
  xp_total: number;
  nivel: number;
};

export type TipoTentativa =
  | "valida"
  | "quase"
  | "aguardando_aprovacao"
  | "desconhecida"
  | "silaba_indisponivel";

export type ResultadoTentativa = {
  valida: boolean;
  tipo: TipoTentativa;
  palavra: string | null;
  silabas: string[];
  nova_na_teia: boolean;
  dica: string | null;
  audio_url: string | null;
  teia_total: number;
  estrelas: number;
  conquistas: Conquista[];
};

export type ResultadoProducao = { texto: string; estrelas: number; conquistas: Conquista[] };

export type ResultadoConclusao = {
  desbloqueadas: { id: number; titulo: string; palavra_geradora: string | null }[];
  estrelas: number;
  conquistas: Conquista[];
  palavras_da_missao: { palavra: string; audio_url: string | null }[];
};

export type PalavraTeia = {
  palavra: string;
  silabas: string[];
  aula: { id: number; titulo: string } | null;
  descoberta_em: string;
  audio_url: string | null;
  imagem_url: string | null;
};

export type Teia = { total: number; palavras: PalavraTeia[] };
