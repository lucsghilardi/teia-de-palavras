import { describe, expect, it } from "vitest";

import { alternarMoeda, falarReais, formatarReais, somaEscolhida } from "./dinheiro";

const moedas = [
  { id: "m1", valor: 1 },
  { id: "m2", valor: 1 },
  { id: "m3", valor: 2 },
  { id: "m4", valor: 5 },
];

describe("dinheiro", () => {
  it("soma só as moedas escolhidas", () => {
    expect(somaEscolhida(moedas, [])).toBe(0);
    expect(somaEscolhida(moedas, ["m3", "m4"])).toBe(7);
    expect(somaEscolhida(moedas, ["m1", "m2", "x"])).toBe(2);
  });

  it("alterna a seleção sem duplicar", () => {
    expect(alternarMoeda([], "m1")).toEqual(["m1"]);
    expect(alternarMoeda(["m1", "m3"], "m1")).toEqual(["m3"]);
    expect(alternarMoeda(["m1"], "m1")).toEqual([]);
  });

  it("formata e fala reais", () => {
    expect(formatarReais(7)).toBe("R$ 7");
    expect(falarReais(1)).toBe("1 real");
    expect(falarReais(12)).toBe("12 reais");
  });
});
