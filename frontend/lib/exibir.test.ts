import { describe, expect, it } from "vitest";

import { exibir, exibirPalavra } from "./exibir";

describe("exibir", () => {
  it("texto como escrito por padrão; caixa alta quando desligado", () => {
    expect(exibir("Missão concluída!")).toBe("Missão concluída!");
    expect(exibir("Missão concluída!", true)).toBe("Missão concluída!");
    expect(exibir("Missão concluída!", false)).toBe("MISSÃO CONCLUÍDA!");
  });

  it("peças e palavras: minúsculas como escrito, caixa alta quando desligado", () => {
    expect(exibirPalavra("TEIA")).toBe("teia");
    expect(exibirPalavra("7 + 5", true)).toBe("7 + 5");
    expect(exibirPalavra("tatu", false)).toBe("TATU");
  });
});
