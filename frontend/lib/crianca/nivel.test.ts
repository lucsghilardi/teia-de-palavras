import { describe, expect, it } from "vitest";

import { progressoDoNivel, textoDaSequencia, textoDasMedalhas, textoDoNivel } from "./nivel";

describe("progressoDoNivel", () => {
  it("é a fração do nível; cheio no último nível ou sem meta", () => {
    expect(progressoDoNivel(2, 15)).toBeCloseTo(2 / 15);
    expect(progressoDoNivel(20, 15)).toBe(1);
    expect(progressoDoNivel(-1, 15)).toBe(0);
    expect(progressoDoNivel(5, null)).toBe(1);
    expect(progressoDoNivel(5, 0)).toBe(1);
  });
});

describe("textos", () => {
  it("nível com o que falta, singular e plural", () => {
    expect(textoDoNivel(2, 2, 15)).toBe("Você está no nível 2. Faltam 13 pontos para o nível 3.");
    expect(textoDoNivel(2, 14, 15)).toBe("Você está no nível 2. Falta 1 ponto para o nível 3.");
    expect(textoDoNivel(16, 3, null)).toBe("Você está no nível 16, o mais alto!");
  });

  it("sequência e medalhas sem comparar com ninguém", () => {
    expect(textoDaSequencia(0)).toMatch(/primeiro dia/);
    expect(textoDaSequencia(1)).toBe("1 dia seguido brincando.");
    expect(textoDaSequencia(4)).toBe("4 dias seguidos brincando.");
    expect(textoDasMedalhas(0, 15)).toBe("Você ainda vai ganhar 15 medalhas.");
    expect(textoDasMedalhas(3, 15)).toBe("3 de 15 medalhas.");
  });
});
