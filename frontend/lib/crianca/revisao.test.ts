import { describe, expect, it } from "vitest";

import { aulaDaRevisao, resumoDaRevisao, rotuloRevisao } from "./revisao";
import type { ItemRevisao } from "@/types/CriancaApp";

const item: ItemRevisao = {
  id: 7,
  disciplina: "matematica",
  chave: "fato:7+5",
  caixa: 0,
  atividade: {
    ordem: 1,
    tipo: "somar_subtrair",
    titulo: null,
    instrucao: null,
    imagem_url: null,
    avaliada: true,
    apoio: "icones",
    itens: [{ id: "7+5", a: 7, b: 5, operacao: "+", opcoes: [11, 12, 13] }],
  },
};

describe("aulaDaRevisao", () => {
  it("vira uma missão virtual de uma atividade só, na disciplina do item", () => {
    const aula = aulaDaRevisao(item);

    expect(aula.id).toBe(0);
    expect(aula.disciplina).toBe("matematica");
    expect(aula.total_atividades).toBe(1);
    expect(aula.atividades).toEqual([item.atividade]);
    expect(aula.palavra_geradora).toBeNull();
  });
});

describe("textos da revisão", () => {
  it("resume o que foi feito, sem nota", () => {
    expect(resumoDaRevisao(1, 1, 0)).toBe("Revisão feita! Você revisou 1 item. Ganhou 1 ponto. Amanhã tem mais.");
    expect(resumoDaRevisao(6, 4, 2)).toBe("Revisão feita! Você revisou 6 itens. Ganhou 4 pontos. Ainda tem mais para revisar hoje.");
    expect(resumoDaRevisao(3, 0, 0)).toBe("Revisão feita! Você revisou 3 itens. Amanhã tem mais.");
    expect(resumoDaRevisao(3, 0, 0).toLowerCase()).not.toMatch(/errad|nota|acertos/);
  });

  it("rótulo da Revisão conforme os itens devidos", () => {
    expect(rotuloRevisao(0)).toBe("Revisão em dia");
    expect(rotuloRevisao(1)).toBe("Revisão: 1 item para hoje");
    expect(rotuloRevisao(6)).toBe("Revisão: 6 itens para hoje");
  });
});
