/**
 * Efeitos sonoros curtos sintetizados com Web Audio (sem arquivos).
 * Todos são opcionais: se o navegador bloquear o áudio, nada quebra.
 */
let contexto: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Ctor) return null;

  contexto ??= new Ctor();

  if (contexto.state === "suspended") {
    void contexto.resume();
  }

  return contexto;
}

function nota(frequencia: number, inicio: number, duracao: number, volume = 0.18, tipo: OscillatorType = "sine") {
  const c = ctx();

  if (!c) return;

  const osc = c.createOscillator();
  const ganho = c.createGain();
  const t0 = c.currentTime + inicio;

  osc.type = tipo;
  osc.frequency.setValueAtTime(frequencia, t0);
  ganho.gain.setValueAtTime(0.0001, t0);
  ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  osc.connect(ganho).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.05);
}

export const sons = {
  /** Toque leve ao encostar numa peça/botão. */
  toque: () => nota(660, 0, 0.08, 0.08, "triangle"),
  /** Palma (etapa das palmas silábicas). */
  palma: () => {
    nota(220, 0, 0.06, 0.2, "square");
    nota(180, 0.01, 0.05, 0.12, "square");
  },
  /** Acerto: arpejo alegre. */
  acerto: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.09, 0.22)),
  /** Dica: dois tons suaves, nunca som de "erro". */
  dica: () => {
    nota(440, 0, 0.18, 0.1);
    nota(494, 0.16, 0.22, 0.1);
  },
  /** Conquista: fanfarra curta. */
  conquista: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.11, 0.25, 0.16)),
};
