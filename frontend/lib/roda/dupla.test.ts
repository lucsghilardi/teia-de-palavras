import { describe, expect, it } from "vitest";

import { descreverResposta, ehMinhaVez, falaDoResultado, parceiro, propostaAberta, respostaDeMudar, rotuloEtapa, tentativaDeMudar } from "./dupla";
import type { Atividade } from "@/types/CriancaApp";
import type { DuplaEstado } from "@/types/Roda";

const dupla: DuplaEstado = {
  id: 1,
  roda_id: 9,
  criancas: [
    { id: 10, apelido: "Ana", avatar: null },
    { id: 20, apelido: "Beto", avatar: null },
  ],
  vez_de: 10,
  tentativa: { id: 5, atividade_ordem: 5, resposta: { silabas: ["TA", "TU"] }, proposta_por: 10, status: "proposta", valida: null, palavra: null, dica: null, resultado: null },
  palavras: [],
};

const escolha: Atividade = {
  ordem: 2,
  tipo: "escolha",
  titulo: null,
  instrucao: null,
  imagem_url: null,
  avaliada: true,
  itens: [{ id: "q1", pergunta: "quem subiu?", icone: null, opcoes: [{ id: "a", texto: "o tatu" }, { id: "b", texto: "a boneca" }] }],
};

describe("dupla", () => {
  it("acha o par e a vez", () => {
    expect(parceiro(dupla, 10)?.apelido).toBe("Beto");
    expect(parceiro(dupla, 99)).toBeNull();
    expect(ehMinhaVez(dupla, 10)).toBe(true);
    expect(ehMinhaVez(dupla, 20)).toBe(false);
    expect(propostaAberta(dupla)?.id).toBe(5);
    expect(propostaAberta({ ...dupla, tentativa: { ...dupla.tentativa!, status: "confirmada" } })).toBeNull();
    expect(propostaAberta(null)).toBeNull();
  });

  it("descreve a proposta com o conteúdo que o par vê", () => {
    expect(descreverResposta({ ...escolha, tipo: "montar_palavras" } as unknown as Atividade, { silabas: ["TA", "TU"] })).toBe("TA-TU");
    expect(descreverResposta(escolha, { item: "q1", opcao: "b" })).toBe("a boneca");
    expect(descreverResposta({ ...escolha, tipo: "somar_subtrair" } as unknown as Atividade, { item: "s1", valor: 12 })).toBe("12");
    expect(descreverResposta(null, { silabas: ["BO", "LA"] })).toBe("BO-LA");
  });

  it("'vamos mudar' vira um resultado sem avaliação e sem palavra proibida", () => {
    const r = respostaDeMudar("Beto", "q1", { xp_total: 7, nivel: 2 });
    const t = tentativaDeMudar("Beto", ["TA", "TU"], { xp_total: 7, teia_total: 3 });

    expect(r.resolvido).toBe(false);
    expect(r.xp_ganho).toBe(0);
    expect(r.xp_total).toBe(7);
    expect(t.xp_total).toBe(7);
    expect(t.valida).toBe(false);
    expect(`${r.mensagem} ${r.dica} ${t.dica}`).not.toMatch(/errad|incorret/);
  });

  it("fala o resultado para quem confirmou", () => {
    const confirmada = { ...dupla.tentativa!, status: "confirmada" as const, resultado: { valida: true, palavra: "TATU" } as never };

    expect(falaDoResultado(confirmada, "montar_palavras")).toContain("TATU");
    expect(falaDoResultado({ ...dupla.tentativa!, status: "recusada" }, "escolha")).toMatch(/outro jeito/);
    expect(falaDoResultado({ ...confirmada, resultado: { correta: false, mensagem: "não foi dessa vez.", dica: "pense de novo." } as never }, "escolha")).toBe("não foi dessa vez. pense de novo.");
  });

  it("rotula a etapa e a conquista", () => {
    expect(rotuloEtapa(3, 9)).toBe("Etapa 3 de 9");
    expect(rotuloEtapa(9, 9)).toBe("Conquista");
  });
});
