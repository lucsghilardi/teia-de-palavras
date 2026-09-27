import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TTL_SEM_VOZ_MS, limparCacheDeVozes, normalizarParaVoz, obterUrlDeVoz, preaquecerVozes, urlEmCache } from "./voz";

type Chamada = [string, RequestInit];

const ok = (url: string) => ({ status: 200, json: async () => ({ url }) });
const semConteudo = { status: 204, json: async () => ({}) };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  limparCacheDeVozes();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("normalizarParaVoz", () => {
  it("apara, colapsa espaços e baixa a caixa preservando acentos (igual ao backend)", () => {
    expect(normalizarParaVoz("  Toque   na\n RESPOSTA. ")).toBe("toque na resposta.");
    expect(normalizarParaVoz("ÁGUA É VIDA")).toBe("água é vida");
  });
});

describe("obterUrlDeVoz", () => {
  it("devolve a URL do backend e passa a responder do cache, inclusive de forma síncrona", async () => {
    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));

    expect(urlEmCache("Oi!")).toBeNull();
    expect(await obterUrlDeVoz("Oi!")).toBe("http://api/vozes/abc.mp3");
    expect(await obterUrlDeVoz("oi!")).toBe("http://api/vozes/abc.mp3");
    expect(urlEmCache("  OI! ")).toBe("http://api/vozes/abc.mp3");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pede pelo proxy da criança, com o texto normalizado e os cookies da sessão", async () => {
    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));

    await obterUrlDeVoz("Vamos  Brincar?");

    const [url, init] = fetchMock.mock.calls[0] as Chamada;
    expect(new URL(url, "http://app").pathname).toBe("/api/crianca-proxy/voz");
    expect(new URL(url, "http://app").searchParams.get("texto")).toBe("vamos brincar?");
    expect(init.credentials).toBe("same-origin");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("junta pedidos iguais em paralelo numa única busca", async () => {
    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));

    const [a, b] = await Promise.all([obterUrlDeVoz("oi"), obterUrlDeVoz("OI")]);

    expect(a).toBe("http://api/vozes/abc.mp3");
    expect(b).toBe("http://api/vozes/abc.mp3");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no 204 devolve null e não pergunta de novo até o TTL passar", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(semConteudo);

    expect(await obterUrlDeVoz("oi")).toBeNull();
    expect(await obterUrlDeVoz("oi")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(TTL_SEM_VOZ_MS + 1);
    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));

    expect(await obterUrlDeVoz("oi")).toBe("http://api/vozes/abc.mp3");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("desiste depois do tempo máximo, aborta a busca e tenta de novo na próxima vez", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("abortado", "AbortError")));
        }),
    );

    const pendente = obterUrlDeVoz("oi");
    await vi.advanceTimersByTimeAsync(3000);

    expect(await pendente).toBeNull();
    expect((fetchMock.mock.calls[0] as Chamada)[1].signal?.aborted).toBe(true);

    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));
    expect(await obterUrlDeVoz("oi")).toBe("http://api/vozes/abc.mp3");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("devolve null quando a rede falha ou o corpo não tem url", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await obterUrlDeVoz("um")).toBeNull();

    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    expect(await obterUrlDeVoz("dois")).toBeNull();

    fetchMock.mockResolvedValueOnce({ status: 500, json: async () => ({}) });
    expect(await obterUrlDeVoz("três")).toBeNull();
  });

  it("nem pergunta por texto vazio ou longo demais", async () => {
    expect(await obterUrlDeVoz("   ")).toBeNull();
    expect(await obterUrlDeVoz("a".repeat(301))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("preaquecerVozes", () => {
  it("dispara uma busca por frase distinta, sem esperar", async () => {
    fetchMock.mockResolvedValue(ok("http://api/vozes/abc.mp3"));

    preaquecerVozes(["oi", "Oi", "tchau"]);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
