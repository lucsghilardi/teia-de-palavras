/**
 * Voz do app da criança, com a prioridade do escopo:
 *   áudio gravado aprovado  >  áudio da aula  >  voz neural em cache  >  Web Speech API pt-BR.
 * (O backend já escolhe entre as duas primeiras; sem URL, este módulo pergunta
 * a `lib/voz.ts` se existe um MP3 neural da frase e só então sintetiza no navegador.)
 *
 * Uma fala por vez no app inteiro: começar outra interrompe a atual. A
 * promessa resolve quando termina, dá erro ou estoura um tempo máximo — a tela
 * NUNCA fica presa esperando áudio (navegadores sem voz, aba em segundo plano).
 */
import { normalizarParaVoz, obterUrlDeVoz, urlEmCache } from "@/lib/voz";

type Ouvinte = (falando: boolean) => void;

let audioAtual: HTMLAudioElement | null = null;
let encerrarAtual: (() => void) | null = null;
let vozPtBr: SpeechSynthesisVoice | null = null;
// Cada `falar`/`parar` avança a geração: uma busca de voz neural que termina
// depois de interrompida não toca atrasada, e o "falando" não apaga cedo.
let geracao = 0;
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

/** Da menos robótica para a mais: "Natural" (Edge), Google, Luciana/Francisca, qualquer pt-BR, qualquer pt. */
function escolherVoz() {
  if (!temSintese()) return;

  const vozes = window.speechSynthesis.getVoices();
  const idioma = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  const ptBr = vozes.filter((v) => idioma(v) === "pt-br");

  vozPtBr =
    ptBr.find((v) => /natural/i.test(v.name)) ??
    ptBr.find((v) => /google/i.test(v.name)) ??
    ptBr.find((v) => /luciana|francisca|female/i.test(v.name)) ??
    ptBr[0] ??
    vozes.find((v) => idioma(v).startsWith("pt")) ??
    null;
}

if (temSintese()) {
  escolherVoz();
  window.speechSynthesis.addEventListener?.("voiceschanged", escolherVoz);
}

/** Texto em caixa alta faz alguns sintetizadores soletrarem ("T-E-I-A"). */
function paraSintese(texto: string): string {
  return normalizarParaVoz(texto);
}

function tempoMaximo(texto: string): number {
  return Math.min(15000, 1500 + texto.length * 110);
}

export function parar() {
  geracao++;
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
      // Já interrompida (parar()/outra fala): o pause() rejeita o play() com
      // AbortError, e sintetizar aqui falaria o texto antigo por cima do novo.
      if (terminou) return;
      // Arquivo quebrado ou bloqueado: cai para a voz sintetizada.
      terminou = true;
      clearTimeout(limite);
      void sintetizar(textoReserva).then(resolve);
    };
    audio.play().catch(() => audio.onerror?.(new Event("error")));
  });
}

/**
 * Fala um texto: toca o áudio dele se houver URL; senão a voz neural em cache;
 * senão sintetiza no navegador. Interrompe o que estiver tocando. Resolve
 * quando termina — ou no tempo máximo.
 */
export async function falar(texto: string, audioUrl?: string | null): Promise<void> {
  parar();
  const minha = geracao;
  avisar(true);

  try {
    if (audioUrl) {
      await tocar(audioUrl, texto);

      return;
    }

    // Cache síncrono primeiro: mantém o gesto do toque (Safari) e não espera nada.
    const url = urlEmCache(texto) ?? (await obterUrlDeVoz(texto));

    // parar()/outra fala durante a busca: não toca atrasado.
    if (geracao !== minha) return;

    if (url) {
      await tocar(url, texto); // tocar() já cai em sintetizar() se o arquivo falhar
    } else {
      await sintetizar(texto);
    }
  } finally {
    if (geracao === minha) avisar(false);
  }
}

/** Fala vários trechos em sequência (ex.: "TEI" ... "A"). */
export async function falarEmSequencia(itens: { texto: string; audio_url?: string | null }[], pausaMs = 250) {
  for (const item of itens) {
    await falar(item.texto, item.audio_url);
    await new Promise((r) => setTimeout(r, pausaMs));
  }
}
