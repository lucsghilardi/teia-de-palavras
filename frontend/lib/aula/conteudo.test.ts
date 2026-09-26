import { describe, expect, it } from "vitest";

import { dicaDaCriacao, metasPendentes, organizarPecas, palavrasDaProducao } from "./conteudo";
import { aulaTeia, criacaoDe } from "./fixtures";

describe("organizarPecas", () => {
  it("põe as da aula primeiro e tira repetidas", () => {
    const { daAula, anteriores } = organizarPecas([
      { texto: "BO", audio_url: null, da_aula: false },
      { texto: "TA", audio_url: null, da_aula: true },
      { texto: "ta", audio_url: null, da_aula: true },
      { texto: "CA", audio_url: null, da_aula: false },
    ]);

    expect(daAula.map((p) => p.texto)).toEqual(["TA"]);
    expect(anteriores.map((p) => p.texto)).toEqual(["BO", "CA"]);
  });
});

describe("metas e dica", () => {
  const { metas } = criacaoDe(aulaTeia());

  it("pendentes descontam as achadas agora", () => {
    expect(metasPendentes(metas).map((m) => m.palavra)).toEqual(["TEIA", "TATU"]);
    expect(metasPendentes(metas, ["teia"]).map((m) => m.palavra)).toEqual(["TATU"]);
  });

  it("dica sugere a primeira sílaba de uma meta escondida", () => {
    expect(dicaDaCriacao(metas)).toBe("Tente começar com TEI.");
    expect(dicaDaCriacao(metas, ["TEIA"])).toBe("Tente começar com TA.");
  });

  it("dica quando tudo foi achado ou não há metas", () => {
    expect(dicaDaCriacao(metas, ["TEIA", "TATU"])).toMatch(/achou todas/);
    expect(dicaDaCriacao([])).toMatch(/Junte duas pecinhas/);
  });
});

describe("palavrasDaProducao", () => {
  it("junta Teia e palavrinhas sem repetir", () => {
    const lista = palavrasDaProducao(
      [
        { palavra: "TATU", audio_url: "/t.mp3" },
        { palavra: "tatu", audio_url: null },
      ],
      ["O", "A", "E", "É", "O"],
    );

    expect(lista.map((p) => p.palavra)).toEqual(["TATU", "O", "A", "E", "É"]);
    expect(lista[0]).toEqual({ palavra: "TATU", audio_url: "/t.mp3", palavrinha: false });
    expect(lista[1].palavrinha).toBe(true);
  });
});
