/**
 * Voz do app da criança, com a prioridade do escopo:
 *   áudio gravado aprovado  >  áudio da aula  >  Web Speech API pt-BR.
 * (O backend já escolhe a melhor URL; aqui é "tem URL? toca; não tem? sintetiza".)
 *
 * Uma fala por vez no app inteiro: começar outra interrompe a atual. A
 * promessa resolve quando termina, dá erro ou estoura um tempo máximo — a tela
 * NUNCA fica presa esperando áudio (navegadores sem voz, aba em segundo plano).
 */
type Ouvinte = (falando: boolean) => void;

let audioAtual: HTMLAudioElement | null = null;
let encerrarAtual: (() => void) | null = null;
let vozPtBr: SpeechSynthesisVoice | null = null;
const ouvintes = new Set<Ouvinte>();

function avisar(falando: boolean) {
  ouvintes.forEach((o) => o(falando));
}

export function aoMudarFala(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);

  return () => ouvintes.delete(ouvinte);
}

function temSintese(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function escolherVoz() {
  if (!temSintese()) return;

  const vozes = window.speechSynthesis.getVoices();
  vozPtBr =
    vozes.find((v) => v.lang === "pt-BR" && /female|luciana|francisca|google/i.test(v.name)) ??
    vozes.find((v) => v.lang === "pt-BR") ??
    vozes.find((v) => v.lang.startsWith("pt")) ??
    null;
}

if (temSintese()) {
  escolherVoz();
  window.speechSynthesis.addEventListener?.("voiceschanged", escolherVoz);
}

/** Texto em caixa alta faz alguns sintetizadores soletrarem ("T-E-I-A"). */
function paraSintese(texto: string): string {
  return texto.toLocaleLowerCase("pt-BR");
}

function tempoMaximo(texto: string): number {
  return Math.min(15000, 1500 + texto.length * 110);
}

export function parar() {
  encerrarAtual?.();
  encerrarAtual = null;

  if (audioAtual) {
    audioAtual.pause();
    audioAtual = null;
  }

  if (temSintese()) {
    window.speechSynthesis.cancel();
  }
}

function sintetizar(texto: string): Promise<void> {
  return new Promise((resolve) => {
    if (!temSintese() || texto.trim() === "") {
      resolve();

      return;
    }

    const fala = new SpeechSynthesisUtterance(paraSintese(texto));
    fala.lang = "pt-BR";
    fala.rate = 0.9;
    fala.pitch = 1.1;

    if (vozPtBr) {
      fala.voice = vozPtBr;
    }

    let terminou = false;
    const fim = () => {
      if (terminou) return;
      terminou = true;
      clearTimeout(limite);
      resolve();
    };
    const limite = setTimeout(fim, tempoMaximo(texto));

    encerrarAtual = fim;
    fala.onend = fim;
    fala.onerror = fim;
    window.speechSynthesis.speak(fala);
  });
}

function tocar(url: string, textoReserva: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audioAtual = audio;

    let terminou = false;
    const fim = () => {
      if (terminou) return;
      terminou = true;
      clearTimeout(limite);
      resolve();
    };
    const limite = setTimeout(fim, 30000);

    encerrarAtual = fim;
    audio.onended = fim;
    audio.onerror = () => {
      // Arquivo quebrado ou bloqueado: cai para a voz sintetizada.
      terminou = true;
      clearTimeout(limite);
      void sintetizar(textoReserva).then(resolve);
    };
    audio.play().catch(() => audio.onerror?.(new Event("error")));
  });
}

/**
 * Fala um texto (ou toca o áudio dele, se houver URL). Interrompe o que
 * estiver tocando. Resolve quando termina — ou no tempo máximo.
 */
export async function falar(texto: string, audioUrl?: string | null): Promise<void> {
  parar();
  avisar(true);

  try {
    if (audioUrl) {
      await tocar(audioUrl, texto);
    } else {
      await sintetizar(texto);
    }
  } finally {
    avisar(false);
  }
}

/** Fala vários trechos em sequência (ex.: "TEI" ... "A"). */
export async function falarEmSequencia(itens: { texto: string; audio_url?: string | null }[], pausaMs = 250) {
  for (const item of itens) {
    await falar(item.texto, item.audio_url);
    await new Promise((r) => setTimeout(r, pausaMs));
  }
}
