import { describe, expect, it } from "vitest";

import { atividadesTeia, aulaTeia, criacaoDe, fraseDe } from "./fixtures";
import { atividadeVisivel, ehConquista, estadoInicial, limitarEtapa, motorAula, podeIrPara, totalEtapas, type EstadoAula } from "./motor";

const carregar = (parcial = {}) => motorAula(estadoInicial, { tipo: "carregar", aula: aulaTeia(parcial) });

describe("motorAula · carregar", () => {
  it("retoma na etapa_atual da API", () => {
    const e = carregar({ etapa_atual: 4 });

    expect(e.etapaAtual).toBe(4);
    expect(e.etapaVisivel).toBe(4);
    expect(e.concluidas).toEqual([1, 2, 3]);
  });

  it("começa na etapa 1 numa aula nova", () => {
    const e = carregar();

    expect(e).toMatchObject({ etapaAtual: 1, etapaVisivel: 1, concluidas: [] });
  });

  it("limita etapa_atual fora do intervalo", () => {
    expect(carregar({ etapa_atual: 99 }).etapaAtual).toBe(8);
    expect(carregar({ etapa_atual: 0 }).etapaAtual).toBe(1);
  });

  it("o total vem das atividades da missão (N+1, com a conquista)", () => {
    expect(carregar().total).toBe(8);
    expect(totalEtapas({ atividades: atividadesTeia().slice(0, 3) })).toBe(4);

    const curta = motorAula(estadoInicial, {
      tipo: "carregar",
      aula: aulaTeia({ atividades: atividadesTeia().slice(0, 3), total_atividades: 3, etapa_atual: 9 }),
    });

    expect(curta.total).toBe(4);
    expect(curta.etapaAtual).toBe(4);
    expect(ehConquista(curta)).toBe(true);
  });

  it("aula concluída: tudo liberado e recomeça do início para rever", () => {
    const e = carregar({ status: "concluida", etapa_atual: 8 });

    expect(e.etapaAtual).toBe(8);
    expect(e.etapaVisivel).toBe(1);
    expect(e.concluidas).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("motorAula · irPara", () => {
  it("volta para uma etapa já liberada", () => {
    const e = motorAula(carregar({ etapa_atual: 5 }), { tipo: "irPara", etapa: 2 });

    expect(e.etapaVisivel).toBe(2);
    expect(e.etapaAtual).toBe(5);
  });

  it("não deixa pular para a frente", () => {
    const antes = carregar({ etapa_atual: 3 });
    const depois = motorAula(antes, { tipo: "irPara", etapa: 4 });

    expect(depois).toBe(antes);
  });

  it("ignora etapas inválidas e aula não carregada", () => {
    const e = carregar({ etapa_atual: 3 });

    expect(motorAula(e, { tipo: "irPara", etapa: 0 })).toBe(e);
    expect(motorAula(e, { tipo: "irPara", etapa: 1.5 })).toBe(e);
    expect(motorAula(estadoInicial, { tipo: "irPara", etapa: 1 })).toBe(estadoInicial);
  });

  it("podeIrPara respeita a fronteira", () => {
    const e = carregar({ etapa_atual: 3 });

    expect(podeIrPara(e, 1)).toBe(true);
    expect(podeIrPara(e, 3)).toBe(true);
    expect(podeIrPara(e, 4)).toBe(false);
  });
});

describe("motorAula · concluirEtapa", () => {
  it("avança para a próxima etapa", () => {
    const e = motorAula(carregar(), { tipo: "concluirEtapa", etapa: 1 });

    expect(e).toMatchObject({ etapaAtual: 2, etapaVisivel: 2, concluidas: [1] });
  });

  it("percorre a aula inteira e para na 8", () => {
    let e: EstadoAula = carregar();

    for (let n = 1; n <= 7; n++) e = motorAula(e, { tipo: "concluirEtapa", etapa: n });

    expect(e.etapaAtual).toBe(8);
    expect(e.etapaVisivel).toBe(8);
    expect(e.concluidas).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const final = motorAula(e, { tipo: "concluirEtapa", etapa: 8 });

    expect(final.etapaAtual).toBe(8);
    expect(final.etapaVisivel).toBe(8);
  });

  it("rever uma etapa antiga não faz a fronteira voltar", () => {
    let e = carregar({ etapa_atual: 6 });
    e = motorAula(e, { tipo: "irPara", etapa: 2 });
    e = motorAula(e, { tipo: "concluirEtapa", etapa: 2 });

    expect(e.etapaAtual).toBe(6);
    expect(e.etapaVisivel).toBe(3);
  });

  it("não conclui etapa ainda trancada", () => {
    const e = carregar({ etapa_atual: 2 });

    expect(motorAula(e, { tipo: "concluirEtapa", etapa: 5 })).toBe(e);
  });

  it("não repete etapas em concluidas", () => {
    let e = carregar({ etapa_atual: 3 });
    e = motorAula(e, { tipo: "concluirEtapa", etapa: 1 });

    expect(e.concluidas).toEqual([1, 2]);
  });
});

describe("motorAula · sincronizar", () => {
  it("adota a etapa do servidor só se for mais adiantada", () => {
    const e = carregar({ etapa_atual: 3 });

    expect(motorAula(e, { tipo: "sincronizar", etapaAtual: 2 })).toBe(e);

    const adiantada = motorAula(e, { tipo: "sincronizar", etapaAtual: 5 });

    expect(adiantada.etapaAtual).toBe(5);
    expect(adiantada.etapaVisivel).toBe(3);
    expect(adiantada.concluidas).toEqual([1, 2, 3, 4]);
  });
});

describe("motorAula · descobrirPalavra", () => {
  it("marca a meta (sem acento, sem caixa) e põe na Teia da frase", () => {
    const e = motorAula(carregar({ etapa_atual: 6 }), { tipo: "descobrirPalavra", palavra: "tatu", audio_url: "/a.mp3" });

    expect(criacaoDe(e.aula!).metas.find((m) => m.palavra === "TATU")?.encontrada).toBe(true);
    expect(criacaoDe(e.aula!).teia_total).toBe(2);
    expect(fraseDe(e.aula!).teia).toContainEqual({ palavra: "tatu", audio_url: "/a.mp3" });
  });

  it("não duplica palavra que já está na Teia", () => {
    const e = motorAula(carregar(), { tipo: "descobrirPalavra", palavra: "TIA", audio_url: null });

    expect(fraseDe(e.aula!).teia.filter((p) => p.palavra === "TIA")).toHaveLength(1);
    expect(criacaoDe(e.aula!).teia_total).toBe(1);
  });

  it("palavra fora das metas ainda entra na Teia", () => {
    const e = motorAula(carregar(), { tipo: "descobrirPalavra", palavra: "TETO", audio_url: null });

    expect(criacaoDe(e.aula!).metas.every((m) => m.palavra !== "TETO")).toBe(true);
    expect(fraseDe(e.aula!).teia.map((p) => p.palavra)).toContain("TETO");
  });

  it("compara ignorando acentos", () => {
    const atividades = atividadesTeia().map((a) =>
      a.tipo === "montar_palavras"
        ? { ...a, metas: [{ palavra: "BONÉ", silabas: ["BO", "NÉ"], imagem_url: null, audio_url: null, encontrada: false }] }
        : a,
    );
    const e = motorAula(motorAula(estadoInicial, { tipo: "carregar", aula: aulaTeia({ atividades }) }), {
      tipo: "descobrirPalavra",
      palavra: "BONE",
      audio_url: null,
    });

    expect(criacaoDe(e.aula!).metas[0].encontrada).toBe(true);
  });
});

describe("motorAula · concluirAula", () => {
  it("marca a aula como concluída com as 8 etapas", () => {
    const e = motorAula(carregar({ etapa_atual: 8 }), { tipo: "concluirAula" });

    expect(e.aula?.status).toBe("concluida");
    expect(e.concluidas).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("ajudantes", () => {
  it("limitarEtapa", () => {
    expect(limitarEtapa(Number.NaN, 8)).toBe(1);
    expect(limitarEtapa(4.7, 8)).toBe(4);
    expect(limitarEtapa(-3, 8)).toBe(1);
    expect(limitarEtapa(9, 8)).toBe(8);
    expect(limitarEtapa(5, 0)).toBe(1);
  });

  it("atividadeVisivel e ehConquista", () => {
    const e = carregar({ etapa_atual: 6 });

    expect(atividadeVisivel(e)?.tipo).toBe("montar_palavras");
    expect(ehConquista(e)).toBe(false);

    const fim = motorAula(carregar({ etapa_atual: 7 }), { tipo: "concluirEtapa", etapa: 7 });

    expect(atividadeVisivel(fim)).toBeNull();
    expect(ehConquista(fim)).toBe(true);
    expect(atividadeVisivel(estadoInicial)).toBeNull();
  });
});
