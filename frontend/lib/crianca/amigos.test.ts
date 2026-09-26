import { describe, expect, it } from "vitest";

import { aulaDaMiniAula, contagemDeReacoes, relogio, resumoDaMinha, rotuloAulaAmigo, rotuloCartaoAmigos } from "./amigos";
import type { EntregaAberta, MinhaMiniAula } from "@/types/CriancaApp";

const entrega: EntregaAberta = {
  id: 7,
  status: "recebida",
  correta: null,
  reacao: null,
  mini_aula: {
    id: 3,
    titulo: "Qual sílaba falta em tatu?",
    disciplina: "portugues",
    tipo: "escolher_silaba",
    autor: { apelido: "Bia", avatar: null },
    audio_url: "/api/crianca-proxy/audios/9",
    created_at: "2026-10-01T10:00:00Z",
  },
  atividade: {
    ordem: 1,
    tipo: "escolher_silaba",
    titulo: null,
    instrucao: null,
    imagem_url: null,
    avaliada: true,
    itens: [{ id: "e1", modo: "completar", palavra: null, alvo: null, pecas: ["TA", null], posicao: 1, opcoes: ["TO", "TU", "TE"] }],
  },
};

const minha = (extra: Partial<MinhaMiniAula>): MinhaMiniAula => ({
  id: 1,
  titulo: "Quanto é 7 + 5?",
  disciplina: "matematica",
  tipo: "somar_subtrair",
  status: "aprovada",
  respondidas: 0,
  reacoes: {},
  created_at: "2026-10-01T10:00:00Z",
  ...extra,
});

describe("aulaDaMiniAula", () => {
  it("vira uma missão virtual de uma atividade só, na disciplina da mini-aula", () => {
    const aula = aulaDaMiniAula(entrega);

    expect(aula.total_atividades).toBe(1);
    expect(aula.atividades[0]).toBe(entrega.atividade);
    expect(aula.disciplina).toBe("portugues");
    expect(aula.palavra_geradora).toBeNull();
  });
});

describe("rótulos", () => {
  it("o cartão da Galáxia só conta quando há aula nova", () => {
    expect(rotuloCartaoAmigos(0)).toBe("Base dos amigos");
    expect(rotuloCartaoAmigos(1)).toBe("Base dos amigos: 1 nova");
    expect(rotuloCartaoAmigos(3)).toBe("Base dos amigos: 3 novas");
  });

  it("a aula recebida diz de quem é e o título", () => {
    expect(rotuloAulaAmigo(entrega)).toBe("Aula de Bia: Qual sílaba falta em tatu?");
  });
});

describe("resumoDaMinha", () => {
  it("conta quantos responderam, sem dizer quem nem quem foi melhor", () => {
    expect(resumoDaMinha(minha({ status: "pendente" }))).toBe("esperando um adulto");
    expect(resumoDaMinha(minha({ respondidas: 0 }))).toBe("chegou aos amigos, ninguém respondeu ainda");
    expect(resumoDaMinha(minha({ respondidas: 1 }))).toBe("chegou aos amigos, 1 amigo respondeu");
    expect(resumoDaMinha(minha({ respondidas: 4 }))).toBe("chegou aos amigos, 4 amigos responderam");
    expect(resumoDaMinha(minha({ status: "recusada" }))).not.toMatch(/errad|incorret/);
  });

  it("lista só as reações recebidas, na ordem fixa", () => {
    expect(contagemDeReacoes(minha({ reacoes: { top: 2, valeu: 1 } }))).toEqual([
      { reacao: "valeu", total: 1 },
      { reacao: "top", total: 2 },
    ]);
    expect(contagemDeReacoes(minha({}))).toEqual([]);
  });
});

describe("relogio", () => {
  it("formata m:ss", () => {
    expect(relogio(0)).toBe("0:00");
    expect(relogio(7)).toBe("0:07");
    expect(relogio(65)).toBe("1:05");
    expect(relogio(-3)).toBe("0:00");
  });
});
