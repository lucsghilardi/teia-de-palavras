// Tipos do app da criança — espelham docs/api-crianca.md.
import type { OpcaoVisual } from "@/types/OpcaoVisual";

export type Conquista = {
  chave: string;
  titulo: string;
  descricao: string;
  emoji: string;
  /** Nome de ícone do lucide (lib/icones.ts). */
  icone: string;
};

/** Uma medalha da lista completa: ganha (data) ou ainda por ganhar (null). */
export type Medalha = Conquista & { desbloqueada_em: string | null };

export type Medalhas = { total: number; desbloqueadas: number; medalhas: Medalha[] };

export type TurmaEntrada = {
  turma: { nome: string; codigo: string };
  criancas: { id: number; apelido: string; avatar: OpcaoVisual }[];
  figuras: OpcaoVisual[];
};

export type Eu = {
  id: number;
  apelido: string;
  avatar: OpcaoVisual;
  /** "Texto como escrito": caso natural e peças em minúsculas (lib/exibir.ts). */
  usa_minusculas: boolean;
  /** Fala a história e a instrução ao chegar na tela; desligada, só o alto-falante fala. */
  narracao_automatica: boolean;
  turma: { id: number; nome: string };
  /** Mesmo valor de `xp` (nome antigo). */
  estrelas: number;
  xp: number;
  nivel: number;
  xp_no_nivel: number;
  /** XP que o nível atual pede para virar o próximo; null no último nível. */
  xp_para_proximo: number | null;
  sequencia_dias: number;
  maior_sequencia: number;
  teia_total: number;
  medalhas_total: number;
  /** Itens da Revisão vencidos hoje. */
  revisao_devidos: number;
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

// ---------- Galáxia ----------

export type Planeta = {
  chave: Disciplina;
  nome: string;
  cor: string;
  icone: string;
  ordem: number;
  tem_palavra_geradora: boolean;
  descricao: string;
  publicadas: number;
  concluidas: number;
  em_andamento: number;
  /** A missão em andamento ou a primeira disponível; null sem missão aberta. */
  proxima: Missao | null;
};

export type Galaxia = {
  planetas: Planeta[];
  /** Até 3 missões, uma por planeta, o planeta parado há mais tempo primeiro. */
  escolhas_do_dia: Missao[];
  revisao: { devidos: number };
  amigos: { novas: number };
};

// ---------- Atividades ----------

/** Tipos registrados no backend (RegistroAtividades) e no front (atividades/registro.ts). */
export type TipoAtividade =
  | "historia"
  | "conversa"
  | "palavra"
  | "palmas"
  | "ficha"
  | "montar_palavras"
  | "frase"
  | "escolha"
  | "verdadeiro_falso"
  | "ordenar"
  | "linha_do_tempo"
  | "parear"
  | "contar"
  | "somar_subtrair"
  | "escolher_silaba"
  | "dinheiro"
  | "mapa_pontos"
  | "ditado";

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

export type PaginaHistoria = { texto: string; imagem_url: string | null; audio_url: string | null; icone?: string | null };

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

// ---------- Genéricas (docs/atividades.md); nunca trazem a resposta certa ----------

export type OpcaoEscolha = { id: string; texto: string };
export type ItemEscolha = { id: string; pergunta: string; icone: string | null; opcoes: OpcaoEscolha[] };
export type AtividadeEscolha = AtividadeBase & { tipo: "escolha" | "verdadeiro_falso"; itens: ItemEscolha[] };

export type ItemOrdenar = { id: string; texto: string; icone: string | null };
export type AtividadeOrdenar = AtividadeBase & {
  tipo: "ordenar" | "linha_do_tempo";
  pergunta: string | null;
  modo: "sequencia" | "tempo" | "numeros";
  itens: ItemOrdenar[];
};

export type ItemParear = { id: string; texto: string; icone: string | null };
export type AtividadeParear = AtividadeBase & {
  tipo: "parear";
  pergunta: string | null;
  esquerda: ItemParear[];
  direita: ItemParear[];
};

export type ItemContar = { id: string; icone: string; quantidade: number; opcoes: number[] };
export type AtividadeContar = AtividadeBase & { tipo: "contar"; itens: ItemContar[] };

export type Operacao = "+" | "-";
export type ItemFato = { id: string; a: number; b: number; operacao: Operacao; opcoes: number[] };
export type AtividadeSomarSubtrair = AtividadeBase & {
  tipo: "somar_subtrair";
  apoio: "icones" | "reta" | "nenhum";
  itens: ItemFato[];
};

export type ItemSilaba = {
  id: string;
  modo: "completar" | "trocar";
  /** Palavra de partida (só em trocar). */
  palavra: string | null;
  /** Palavra de chegada (só em trocar). */
  alvo: string | null;
  /** Sílabas com `null` no lugar da que a criança escolhe. */
  pecas: (string | null)[];
  posicao: number;
  opcoes: string[];
};
export type AtividadeEscolherSilaba = AtividadeBase & { tipo: "escolher_silaba"; itens: ItemSilaba[] };

export type Moeda = { id: string; valor: number };
export type ItemDinheiro = { id: string; preco: number; moedas: Moeda[] };
export type AtividadeDinheiro = AtividadeBase & { tipo: "dinheiro"; itens: ItemDinheiro[] };

export type PontoMapa = { chave: string; rotulo: string; icone: string | null; x: number; y: number };
export type AtividadeMapaPontos = AtividadeBase & {
  tipo: "mapa_pontos";
  cenario: string;
  pontos: PontoMapa[];
  itens: { id: string; texto: string }[];
};

export type ItemDitado = {
  id: string;
  audio_url: string | null;
  /** A palavra em minúsculas, só para a voz do navegador: nunca vai para a tela. */
  fala: string;
  /** Quantas peças a palavra tem. */
  tamanho: number;
  opcoes: string[];
};
export type AtividadeDitado = AtividadeBase & { tipo: "ditado"; itens: ItemDitado[] };

export type Atividade =
  | AtividadeHistoria
  | AtividadeConversa
  | AtividadePalavra
  | AtividadePalmas
  | AtividadeFicha
  | AtividadeMontarPalavras
  | AtividadeFrase
  | AtividadeEscolha
  | AtividadeOrdenar
  | AtividadeParear
  | AtividadeContar
  | AtividadeSomarSubtrair
  | AtividadeEscolherSilaba
  | AtividadeDinheiro
  | AtividadeMapaPontos
  | AtividadeDitado;

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

/** Resposta genérica de POST .../atividades/{ordem}/responder (docs/atividades.md). */
export type ResultadoResposta = {
  correta: boolean;
  item: string;
  mensagem: string;
  dica: string | null;
  /** Só a partir da 2ª tentativa errada do item. */
  resposta_correta: unknown;
  xp_ganho: number;
  tentativas: number;
  /** Acertou ou já viu a resposta: pode seguir. */
  resolvido: boolean;
  revisao_agendada: boolean;
  extra: Record<string, unknown>;
  xp_total: number;
  nivel: number;
  conquistas: Conquista[];
};

// ---------- Revisão espaçada ----------

/** Um item vencido, remontado como atividade de um só item (docs/api-crianca.md). */
export type ItemRevisao = {
  id: number;
  disciplina: Disciplina;
  chave: string;
  caixa: number;
  atividade: Atividade;
};

export type Revisao = { devidos: number; itens: ItemRevisao[] };

export type ResultadoRevisao = ResultadoResposta & { caixa: number; proxima_revisao_em: string | null };

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

// ---------- Base dos amigos (mini-aulas) ----------

/** Um desafio pronto, gerado da missão; a criança escolhe um e grava a voz (nunca digita). */
export type ModeloMiniAula = { chave: string; tipo: TipoAtividade; titulo: string; fala: string };

export type ModelosMiniAula = {
  aula: { id: number; titulo: string; rotulo: string; disciplina: Disciplina };
  semente: number;
  modelos: ModeloMiniAula[];
  limite_segundos: number;
};

export type MiniAulaCriada = { id: number; status: "pendente"; titulo: string; mensagem: string };

export type StatusMiniAula = "pendente" | "aprovada" | "recusada";

export type Reacao = "valeu" | "aprendi" | "top";

/** Uma mini-aula da própria criança: quantos amigos responderam e as reações (nunca quem foi melhor). */
export type MinhaMiniAula = {
  id: number;
  titulo: string;
  disciplina: Disciplina;
  tipo: TipoAtividade;
  status: StatusMiniAula;
  respondidas: number;
  reacoes: Partial<Record<Reacao, number>>;
  created_at: string;
};

/** Uma mini-aula recebida de um amigo (só apelido e avatar do autor). */
export type EntregaMiniAula = {
  id: number;
  status: "recebida" | "respondida";
  correta: boolean | null;
  reacao: Reacao | null;
  mini_aula: {
    id: number;
    titulo: string;
    disciplina: Disciplina;
    tipo: TipoAtividade;
    autor: { apelido: string; avatar: OpcaoVisual | null };
    audio_url: string | null;
    created_at: string;
  };
};

export type MiniAulasRecebidas = { novas: number; entregas: EntregaMiniAula[] };

/** A entrega aberta para jogar: o desafio montado, sem a resposta. */
export type EntregaAberta = EntregaMiniAula & { atividade: Atividade };
