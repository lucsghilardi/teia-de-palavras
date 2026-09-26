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

export type Missao = {
  id: number;
  titulo: string;
  fase: number;
  ordem: number;
  palavra_geradora: string;
  palavra_imagem_url: string | null;
  status: StatusMissao;
  etapa_atual: number | null;
};

export type ItemFalado = { texto: string; audio_url: string | null };

export const ETAPAS = [
  "missao",
  "conversa",
  "palavra",
  "palmas",
  "ficha",
  "criacao",
  "producao",
  "conquista",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export type AulaCrianca = {
  id: number;
  titulo: string;
  fase: number;
  palavra_geradora: string;
  palavra_imagem_url: string | null;
  palavra_audio_url: string | null;
  status: StatusMissao;
  etapa_atual: number;
  etapas: Etapa[];
  historia: { texto: string; imagem_url: string | null; audio_url: string | null }[];
  perguntas: ItemFalado[];
  palmas: ItemFalado[];
  ficha: { silaba: string; membros: ItemFalado[] }[];
  pecas: (ItemFalado & { da_aula: boolean })[];
  metas: {
    palavra: string;
    silabas: string[];
    imagem_url: string | null;
    audio_url: string | null;
    encontrada: boolean;
  }[];
  teia: { palavra: string; audio_url: string | null }[];
  palavrinhas: string[];
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
  desbloqueadas: { id: number; titulo: string; palavra_geradora: string }[];
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
