import { describe, expect, it } from "vitest";

import { falaDaPergunta, listaComOu } from "./falas";

describe("listaComOu", () => {
  it("junta com vírgulas e 'ou' antes da última", () => {
    expect(listaComOu(["o tatu", "a boneca", "o robô"])).toBe("o tatu, a boneca ou o robô");
    expect(listaComOu(["verdadeiro", "falso"])).toBe("verdadeiro ou falso");
  });

  it("ignora vazios e devolve a única opção sozinha", () => {
    expect(listaComOu([" 7 ", "", "  "])).toBe("7");
    expect(listaComOu([])).toBe("");
  });
});

describe("falaDaPergunta", () => {
  it("lê a pergunta e depois as opções", () => {
    expect(falaDaPergunta("Quantos foguetes há agora?", ["7", "6", "8"])).toBe("Quantos foguetes há agora? 7, 6 ou 8?");
  });

  it("fecha a frase de verdadeiro ou falso antes das opções", () => {
    expect(falaDaPergunta("A rua fica dentro da casa", ["verdadeiro", "falso"])).toBe("A rua fica dentro da casa. verdadeiro ou falso?");
  });

  it("sem opções, é só a pergunta", () => {
    expect(falaDaPergunta("  Onde fica a escola? ", [])).toBe("Onde fica a escola?");
  });
});
