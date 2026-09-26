// Aula de exemplo (Missão 1: TEIA) para os testes do motor.
import type { AulaCrianca } from "@/types/CriancaApp";

export function aulaTeia(parcial: Partial<AulaCrianca> = {}): AulaCrianca {
  return {
    id: 1,
    titulo: "Missão 1: A teia do bairro",
    fase: 1,
    palavra_geradora: "TEIA",
    palavra_imagem_url: null,
    palavra_audio_url: null,
    status: "em_andamento",
    etapa_atual: 1,
    etapas: ["missao", "conversa", "palavra", "palmas", "ficha", "criacao", "producao", "conquista"],
    historia: [{ texto: "Era uma vez...", imagem_url: null, audio_url: null }],
    perguntas: [{ texto: "Quem ajuda?", audio_url: null }],
    palmas: [
      { texto: "TEI", audio_url: null },
      { texto: "A", audio_url: null },
    ],
    ficha: [
      { silaba: "TEI", membros: ["TA", "TE", "TI", "TO", "TU"].map((texto) => ({ texto, audio_url: null })) },
      { silaba: "A", membros: ["A", "E", "I", "O", "U"].map((texto) => ({ texto, audio_url: null })) },
    ],
    pecas: [
      ...["TA", "TE", "TI", "TO", "TU", "A", "E", "I", "O", "U"].map((texto) => ({ texto, audio_url: null, da_aula: true })),
    ],
    metas: [
      { palavra: "TEIA", silabas: ["TEI", "A"], imagem_url: null, audio_url: null, encontrada: false },
      { palavra: "TATU", silabas: ["TA", "TU"], imagem_url: null, audio_url: null, encontrada: false },
      { palavra: "TIA", silabas: ["TI", "A"], imagem_url: null, audio_url: null, encontrada: true },
    ],
    teia: [{ palavra: "TIA", audio_url: null }],
    palavrinhas: ["O", "A", "E", "É", "UM", "UMA", "NO", "NA", "DO", "DA", "TEM", "COM"],
    ...parcial,
  };
}
