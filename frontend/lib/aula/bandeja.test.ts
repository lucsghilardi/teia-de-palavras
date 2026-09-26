import { describe, expect, it } from "vitest";

import { adicionar, BANDEJA_VAZIA, cheia, limpar, MAX_BANDEJA, remover, texto, vazia } from "./bandeja";

describe("bandeja", () => {
  it("adiciona peças no fim", () => {
    const b = adicionar(adicionar(BANDEJA_VAZIA, "TA"), "TU");

    expect(b).toEqual(["TA", "TU"]);
    expect(texto(b)).toBe("TATU");
  });

  it("aceita no máximo 4 peças", () => {
    let b = BANDEJA_VAZIA;

    for (const p of ["TA", "TE", "TI", "TO", "TU"]) b = adicionar(b, p);

    expect(MAX_BANDEJA).toBe(4);
    expect(b).toEqual(["TA", "TE", "TI", "TO"]);
    expect(cheia(b)).toBe(true);
    expect(adicionar(b, "A")).toBe(b);
  });

  it("aceita outro limite (tira de frase)", () => {
    let b = BANDEJA_VAZIA;

    for (const p of ["O", "TATU", "TEM", "TETO", "E", "UMA"]) b = adicionar(b, p, 8);

    expect(b).toHaveLength(6);
    expect(texto(b, " ")).toBe("O TATU TEM TETO E UMA");
  });

  it("ignora peça vazia", () => {
    expect(adicionar(BANDEJA_VAZIA, "  ")).toBe(BANDEJA_VAZIA);
  });

  it("remove pela posição, inclusive peças repetidas", () => {
    const b = ["TA", "TA", "TU"];

    expect(remover(b, 1)).toEqual(["TA", "TU"]);
    expect(remover(b, 0)).toEqual(["TA", "TU"]);
    expect(remover(b, 2)).toEqual(["TA", "TA"]);
  });

  it("índice inválido não muda nada", () => {
    const b = ["TA"];

    expect(remover(b, 5)).toBe(b);
    expect(remover(b, -1)).toBe(b);
    expect(remover(b, 0.5)).toBe(b);
  });

  it("não altera a lista original", () => {
    const b = ["TA", "TU"];
    adicionar(b, "TE");
    remover(b, 0);

    expect(b).toEqual(["TA", "TU"]);
  });

  it("limpa", () => {
    expect(limpar()).toEqual([]);
    expect(vazia(limpar())).toBe(true);
    expect(vazia(["TA"])).toBe(false);
    expect(texto(limpar())).toBe("");
  });
});
