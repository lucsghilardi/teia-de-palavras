import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CATALOGO_ILUSTRACOES, existeIlustracao, rotuloIlustracao } from "./catalogo";

const SEEDERS = join(__dirname, "../../../../backend/laravel/database/seeders");

/** Toda chave `'ilustracao' => '...'` citada pelos seeders de conteúdo. */
function chavesDosSeeders(): { arquivo: string; chave: string }[] {
  return readdirSync(SEEDERS)
    .filter((arquivo) => arquivo.startsWith("Conteudo") && arquivo.endsWith(".php"))
    .flatMap((arquivo) =>
      [...readFileSync(join(SEEDERS, arquivo), "utf8").matchAll(/'ilustracao'\s*=>\s*'([^']+)'/g)].map((m) => ({ arquivo, chave: m[1] })),
    );
}

describe("catálogo de ilustrações", () => {
  it("não repete chave e usa só minúsculas, números e hífens (a regra do backend)", () => {
    const chaves = CATALOGO_ILUSTRACOES.map((i) => i.chave);

    expect(new Set(chaves).size).toBe(chaves.length);
    chaves.forEach((chave) => expect(chave).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it("toda cena do catálogo tem desenho em cenas.tsx (e vice-versa)", () => {
    const fonte = readFileSync(join(__dirname, "cenas.tsx"), "utf8");
    const mapa = fonte.slice(fonte.indexOf("export const CENAS"));
    const desenhadas = [...mapa.matchAll(/^\s+"([a-z0-9-]+)":/gm)].map((m) => m[1]).sort();

    expect(desenhadas).toEqual(CATALOGO_ILUSTRACOES.map((i) => i.chave).sort());
  });

  it("toda ilustração citada pelos seeders existe no catálogo", () => {
    const citadas = chavesDosSeeders();

    expect(citadas.length).toBeGreaterThan(0);
    citadas.forEach(({ arquivo, chave }) => expect(existeIlustracao(chave), `${arquivo}: ${chave}`).toBe(true));
  });

  it("chave desconhecida ou vazia não passa", () => {
    expect(existeIlustracao("nao-existe")).toBe(false);
    expect(existeIlustracao(null)).toBe(false);
    expect(existeIlustracao("")).toBe(false);
    expect(rotuloIlustracao("capa-teia")).toMatch(/Teia/);
  });
});
