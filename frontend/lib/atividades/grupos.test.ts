import { describe, expect, it } from "vitest";

import { dezenasEUnidades, fileirasDeDez } from "./grupos";

describe("fileirasDeDez", () => {
  it("quebra em fileiras de 10 com o resto no fim", () => {
    expect(fileirasDeDez(12)).toEqual([10, 2]);
    expect(fileirasDeDez(10)).toEqual([10]);
    expect(fileirasDeDez(7)).toEqual([7]);
    expect(fileirasDeDez(0)).toEqual([]);
    expect(fileirasDeDez(23)).toEqual([10, 10, 3]);
  });

  it("descreve dezenas e unidades", () => {
    expect(dezenasEUnidades(12)).toBe("1 dezena e 2 unidades");
    expect(dezenasEUnidades(20)).toBe("2 dezenas");
    expect(dezenasEUnidades(1)).toBe("1 unidade");
    expect(dezenasEUnidades(0)).toBe("0 unidades");
  });
});
