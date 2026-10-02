import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Áudio falso com o comportamento dos navegadores: `play()` fica pendente
 * enquanto o arquivo carrega e um `pause()` nesse meio-tempo rejeita a
 * promessa com AbortError ("The play() request was interrupted by a call to pause()").
 */
class AudioFalso {
  static criados: AudioFalso[] = [];
  onended: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  private rejeitar: ((e: Error) => void) | null = null;

  constructor(public src: string) {
    AudioFalso.criados.push(this);
  }

  play() {
    return new Promise<void>((_, rejeitar) => {
      this.rejeitar = rejeitar;
    });
  }

  pause() {
    const erro = new Error("The play() request was interrupted by a call to pause()");
    erro.name = "AbortError";
    this.rejeitar?.(erro);
  }

  /** O arquivo não carregou (404, rede). */
  falhar() {
    this.onerror?.(new Event("error"));
  }
}

let falados: string[];

async function carregar() {
  vi.resetModules();
  falados = [];
  AudioFalso.criados = [];

  const speechSynthesis = {
    getVoices: () => [],
    addEventListener: () => {},
    cancel: vi.fn(),
    speak: vi.fn((f: { text: string }) => falados.push(f.text)),
  };

  vi.stubGlobal("window", { speechSynthesis });
  vi.stubGlobal("Audio", AudioFalso);
  vi.stubGlobal("Event", class {
    constructor(public type: string) {}
  });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      rate = 1;
      pitch = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    },
  );

  return import("./fala");
}

const microtarefas = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("falar", () => {
  it("interromper um áudio que ainda carrega não fala o texto antigo por cima do novo", async () => {
    const { falar } = await carregar();

    void falar("Palavra antiga", "/vozes/antiga.mp3");
    void falar("Frase nova", "/vozes/nova.mp3");
    await microtarefas();

    expect(falados).toEqual([]);
    expect(AudioFalso.criados.map((a) => a.src)).toEqual(["/vozes/antiga.mp3", "/vozes/nova.mp3"]);
  });

  it("parar() também não ressuscita a fala interrompida na voz do navegador", async () => {
    const { falar, parar } = await carregar();

    void falar("Palavra antiga", "/vozes/antiga.mp3");
    parar();
    await microtarefas();

    expect(falados).toEqual([]);
  });

  it("um erro atrasado do arquivo antigo não fala por cima da fala atual", async () => {
    const { falar } = await carregar();

    void falar("Palavra antiga", "/vozes/antiga.mp3");
    void falar("Frase nova", "/vozes/nova.mp3");
    AudioFalso.criados[0].falhar();
    await microtarefas();

    expect(falados).toEqual([]);
  });

  it("se o arquivo da fala ATUAL falhar, cai para a voz do navegador", async () => {
    const { falar } = await carregar();

    void falar("Frase nova", "/vozes/quebrada.mp3");
    AudioFalso.criados[0].falhar();
    await microtarefas();

    expect(falados).toEqual(["frase nova"]);
  });
});
