import type { Disciplina } from "@/types/CriancaApp";

/** Espelho de backend/laravel/config/disciplinas.php (os "planetas"). */
export type InfoDisciplina = {
  chave: Disciplina;
  nome: string;
  cor: string;
  icone: string;
  descricao: string;
  /** Só Português tem palavra geradora, sílabas, famílias e Teia. */
  temPalavraGeradora: boolean;
};

export const DISCIPLINAS: InfoDisciplina[] = [
  {
    chave: "portugues",
    nome: "Português",
    cor: "#a78bfa",
    icone: "book-open",
    descricao: "Ler e escrever: palavras geradoras, famílias silábicas, frases e a Teia de Palavras.",
    temPalavraGeradora: true,
  },
  {
    chave: "matematica",
    nome: "Matemática",
    cor: "#22d3ee",
    icone: "calculator",
    descricao: "Contar, comparar, somar e subtrair até 100, dinheiro, formas e tempo (BNCC 1º ano).",
    temPalavraGeradora: false,
  },
  {
    chave: "geografia",
    nome: "Geografia",
    cor: "#34d399",
    icone: "map",
    descricao: "Casa, rua, bairro, mapas simples, campo e cidade, dia e noite (BNCC 1º ano).",
    temPalavraGeradora: false,
  },
  {
    chave: "historia",
    nome: "História",
    cor: "#fbbf24",
    icone: "hourglass",
    descricao: "Antes e depois, linha do tempo, família, comunidade e trabalhos (BNCC 1º ano).",
    temPalavraGeradora: false,
  },
];

export function infoDisciplina(chave: string | null | undefined): InfoDisciplina {
  return DISCIPLINAS.find((d) => d.chave === chave) ?? DISCIPLINAS[0];
}

export function ordemDaDisciplina(chave: string | null | undefined): number {
  const i = DISCIPLINAS.findIndex((d) => d.chave === chave);

  return i < 0 ? DISCIPLINAS.length : i;
}
