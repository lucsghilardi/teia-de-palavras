import type { Disciplina } from "@/types/CriancaApp";

/**
 * Catálogo dos tipos de atividade para o editor: nome, descrição curta, em
 * quais disciplinas fazem sentido e um config de exemplo (docs/atividades.md).
 * A lista de tipos válidos é a do backend (RegistroAtividades).
 */
export type ModeloAtividade = {
  tipo: string;
  nome: string;
  descricao: string;
  /** Vazio = qualquer disciplina. */
  disciplinas: Disciplina[];
  avaliada: boolean;
  modelo: Record<string, unknown>;
};

export const MODELOS_ATIVIDADE: ModeloAtividade[] = [
  {
    tipo: "historia",
    nome: "História",
    descricao: "Páginas de texto com narração. Em Português usa as páginas da aba História; nas outras disciplinas, o JSON.",
    disciplinas: [],
    avaliada: false,
    modelo: { paginas: [{ texto: "A nave Teia decola da base lunar.", icone: "rocket" }] },
  },
  {
    tipo: "conversa",
    nome: "Conversa",
    descricao: "Perguntas abertas para conversar com quem está perto (sem resposta certa).",
    disciplinas: [],
    avaliada: false,
    modelo: { perguntas: ["O que você faria no lugar da tripulação?"] },
  },
  { tipo: "palavra", nome: "Palavra geradora", descricao: "A palavra da missão, grande, com figura e voz.", disciplinas: ["portugues"], avaliada: false, modelo: {} },
  { tipo: "palmas", nome: "Palmas", descricao: "Separar a palavra em sílabas batendo palmas.", disciplinas: ["portugues"], avaliada: false, modelo: {} },
  { tipo: "ficha", nome: "Ficha de descoberta", descricao: "As famílias silábicas de cada sílaba da palavra.", disciplinas: ["portugues"], avaliada: false, modelo: {} },
  { tipo: "montar_palavras", nome: "Montar palavras", descricao: "Juntar sílabas desta e das outras missões para descobrir palavras.", disciplinas: ["portugues"], avaliada: true, modelo: { minimo_palavras: 1 } },
  { tipo: "frase", nome: "Frase", descricao: "Montar uma frase com as palavras da Teia.", disciplinas: ["portugues"], avaliada: true, modelo: { minimo: 2 } },
  {
    tipo: "escolha",
    nome: "Escolha",
    descricao: "Pergunta com opções; uma certa. Dica no 1º erro, resposta no 2º.",
    disciplinas: [],
    avaliada: true,
    modelo: {
      itens: [
        { pergunta: "Quantos planetas a nave visitou?", opcoes: ["3", "5", "7"], correta: 0, dica: "Conte as bandeiras na história.", explicacao: "Foram 3 planetas." },
      ],
      embaralhar: true,
    },
  },
  {
    tipo: "verdadeiro_falso",
    nome: "Verdadeiro ou falso",
    descricao: "Frases para julgar.",
    disciplinas: [],
    avaliada: true,
    modelo: { itens: [{ frase: "A Lua gira em volta da Terra.", correta: true, dica: "Pense no céu à noite." }] },
  },
  {
    tipo: "ordenar",
    nome: "Ordenar",
    descricao: "Colocar itens na ordem certa (a ordem do JSON é a correta).",
    disciplinas: [],
    avaliada: true,
    modelo: { instrucao: "O que vem primeiro?", modo: "sequencia", itens: [{ texto: "acordar", icone: "sun" }, { texto: "escovar os dentes" }, { texto: "ir para a escola" }], dica: "Pense no começo do dia." },
  },
  {
    tipo: "linha_do_tempo",
    nome: "Linha do tempo",
    descricao: "Ordenar acontecimentos no tempo (antes e depois).",
    disciplinas: ["historia", "geografia", "portugues", "matematica"],
    avaliada: true,
    modelo: { instrucao: "Do mais antigo ao mais novo", modo: "tempo", itens: [{ texto: "bebê", icone: "baby" }, { texto: "criança", icone: "smile" }, { texto: "adulto", icone: "user" }] },
  },
  {
    tipo: "parear",
    nome: "Ligar os pares",
    descricao: "Duas colunas; a criança liga cada item ao seu par.",
    disciplinas: [],
    avaliada: true,
    modelo: { instrucao: "Ligue cada lugar ao que acontece nele", pares: [{ a: "escola", b: "estudar", icone_a: "school" }, { a: "padaria", b: "fazer pão", icone_a: "store" }, { a: "hospital", b: "cuidar", icone_a: "hospital" }] },
  },
  {
    tipo: "contar",
    nome: "Contar",
    descricao: "Objetos em fileiras de 10 e opções de número.",
    disciplinas: ["matematica"],
    avaliada: true,
    modelo: { itens: [{ icone: "star", quantidade: 12 }, { icone: "rocket", quantidade: 7 }] },
  },
  {
    tipo: "somar_subtrair",
    nome: "Somar e subtrair",
    descricao: "Fatos fixos ou gerados, com apoio de ícones, reta numérica ou só símbolos.",
    disciplinas: ["matematica"],
    avaliada: true,
    modelo: { gerar: { quantidade: 4, maximo: 10, operacoes: ["+"] }, apoio: "icones" },
  },
  {
    tipo: "escolher_silaba",
    nome: "Escolher a sílaba",
    descricao: "Completar a sílaba que falta ou trocar uma sílaba para formar outra palavra (EF01LP08).",
    disciplinas: ["portugues"],
    avaliada: true,
    modelo: {
      itens: [
        { modo: "completar", palavra: "TATU", silabas: ["TA", "TU"], oculta: 1, opcoes: ["TU", "TO", "TE"] },
        { modo: "trocar", de: "MOLA", silabas: ["MO", "LA"], para: "MALA", posicao: 0, opcoes: ["MA", "MO", "LA"] },
      ],
    },
  },
];

MODELOS_ATIVIDADE.push(
  {
    tipo: "dinheiro",
    nome: "Dinheiro",
    descricao: "Juntar moedas e notas (reais inteiros) para pagar o preço; qualquer combinação certa vale (EF01MA19).",
    disciplinas: ["matematica"],
    avaliada: true,
    modelo: { itens: [{ preco: 3, moedas: [1, 1, 1, 2, 5] }, { preco: 7, moedas: [1, 2, 2, 5, 10] }] },
  },
  {
    tipo: "mapa_pontos",
    nome: "Mapa com pontos",
    descricao: "Um cenário visto de cima (bairro ou escola) com lugares marcados; a criança toca no lugar pedido.",
    disciplinas: ["geografia", "historia"],
    avaliada: true,
    modelo: {
      cenario: "bairro",
      pontos: [
        { chave: "escola", rotulo: "a escola", icone: "school", x: 0.74, y: 0.25 },
        { chave: "padaria", rotulo: "a padaria", icone: "store", x: 0.5, y: 0.52 },
        { chave: "praca", rotulo: "a praça", icone: "tree", x: 0.2, y: 0.75 },
      ],
      perguntas: [{ alvo: "escola", texto: "Onde fica a escola?", dica: "Toque nos lugares para ouvir o nome." }],
    },
  },
  {
    tipo: "ditado",
    nome: "Ditado",
    descricao: "A criança ouve a palavra e monta com peças de sílaba (as certas entram sozinhas; opções são distratores).",
    disciplinas: ["portugues"],
    avaliada: true,
    modelo: { itens: [{ palavra: "TETO", silabas: ["TE", "TO"], opcoes: ["TA", "TU"] }] },
  },
);

export function modeloDoTipo(tipo: string): ModeloAtividade | undefined {
  return MODELOS_ATIVIDADE.find((m) => m.tipo === tipo);
}

export function nomeDoTipo(tipo: string): string {
  return modeloDoTipo(tipo)?.nome ?? tipo;
}

/** Tipos que fazem sentido na disciplina. */
export function modelosPara(disciplina: Disciplina): ModeloAtividade[] {
  return MODELOS_ATIVIDADE.filter((m) => m.disciplinas.length === 0 || m.disciplinas.includes(disciplina));
}
