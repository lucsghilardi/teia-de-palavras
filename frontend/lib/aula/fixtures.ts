// Missão de exemplo (Missão 1: TEIA) para os testes do motor.
import type { AulaCrianca, Atividade } from "@/types/CriancaApp";

const falado = (texto: string) => ({ texto, audio_url: null });

const base = { titulo: null, instrucao: null, imagem_url: null };

export function atividadesTeia(): Atividade[] {
  return [
    { ...base, ordem: 1, tipo: "historia", avaliada: false, paginas: [{ texto: "Era uma vez...", imagem_url: null, audio_url: null }] },
    { ...base, ordem: 2, tipo: "conversa", avaliada: false, perguntas: [falado("Quem ajuda?")] },
    { ...base, ordem: 3, tipo: "palavra", avaliada: false, palavra: "TEIA", audio_url: null },
    { ...base, ordem: 4, tipo: "palmas", avaliada: false, silabas: [falado("TEI"), falado("A")] },
    {
      ...base,
      ordem: 5,
      tipo: "ficha",
      avaliada: false,
      linhas: [
        { silaba: "TEI", membros: ["TA", "TE", "TI", "TO", "TU"].map(falado) },
        { silaba: "A", membros: ["A", "E", "I", "O", "U"].map(falado) },
      ],
    },
    {
      ...base,
      ordem: 6,
      tipo: "montar_palavras",
      avaliada: true,
      pecas: ["TA", "TE", "TI", "TO", "TU", "A", "E", "I", "O", "U"].map((texto) => ({ texto, audio_url: null, da_aula: true })),
      metas: [
        { palavra: "TEIA", silabas: ["TEI", "A"], imagem_url: null, audio_url: null, encontrada: false },
        { palavra: "TATU", silabas: ["TA", "TU"], imagem_url: null, audio_url: null, encontrada: false },
        { palavra: "TIA", silabas: ["TI", "A"], imagem_url: null, audio_url: null, encontrada: true },
      ],
      teia_total: 1,
      minimo_palavras: 1,
    },
    {
      ...base,
      ordem: 7,
      tipo: "frase",
      avaliada: true,
      teia: [{ palavra: "TIA", audio_url: null }],
      palavrinhas: ["O", "A", "E", "É", "UM", "UMA", "NO", "NA", "DO", "DA", "TEM", "COM"],
      minimo: 2,
    },
  ];
}

export function aulaTeia(parcial: Partial<AulaCrianca> = {}): AulaCrianca {
  return {
    id: 1,
    titulo: "Missão 1: A teia do bairro",
    descricao: null,
    disciplina: "portugues",
    rotulo: "TEIA",
    fase: 1,
    palavra_geradora: "TEIA",
    palavra_imagem_url: null,
    palavra_audio_url: null,
    status: "em_andamento",
    etapa_atual: 1,
    total_atividades: 7,
    atividades: atividadesTeia(),
    ...parcial,
  };
}

/** Atalhos para os testes: a atividade de criação e a de frase da fixture. */
export function criacaoDe(aula: AulaCrianca) {
  const a = aula.atividades.find((x) => x.tipo === "montar_palavras");

  if (!a || a.tipo !== "montar_palavras") throw new Error("fixture sem montar_palavras");

  return a;
}

export function fraseDe(aula: AulaCrianca) {
  const a = aula.atividades.find((x) => x.tipo === "frase");

  if (!a || a.tipo !== "frase") throw new Error("fixture sem frase");

  return a;
}
