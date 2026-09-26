import { describe, expect, it } from "vitest";

import { completa, devolver, escolher, restantes } from "./sequencia";

const todos = ["a", "b", "c"];

describe("sequencia por toque", () => {
  it("escolhe só itens disponíveis e sem repetir", () => {
    expect(escolher([], "a", todos)).toEqual(["a"]);
    expect(escolher(["a"], "a", todos)).toEqual(["a"]);
    expect(escolher(["a"], "z", todos)).toEqual(["a"]);
  });

  it("devolver tira o item e os seguintes", () => {
    expect(devolver(["a", "b", "c"], "b")).toEqual(["a"]);
    expect(devolver(["a"], "z")).toEqual(["a"]);
  });

  it("completa e restantes", () => {
    expect(completa(["a", "b", "c"], 3)).toBe(true);
    expect(completa(["a"], 3)).toBe(false);
    expect(restantes(["b"], todos)).toEqual(["a", "c"]);
  });
});
