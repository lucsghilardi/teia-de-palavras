/**
 * Voz neural em cache (docs/api-crianca.md, "Voz neural"). O backend sintetiza
 * cada frase UMA vez (Google Cloud TTS), guarda pelo hash do texto e devolve a
 * URL do MP3; sem provedor configurado responde 204 e o app fala com a voz do
 * navegador (lib/fala.ts). Este módulo só descobre a URL: nunca rejeita, nunca
 * segura a tela e lembra as respostas para não perguntar duas vezes.
 *
 * `fetch` puro (e não services/crianca.ts): lib/ não depende de services/, e o
 * caminho é o mesmo proxy /api/crianca-proxy, que repassa sem Bearer nas telas
 * de entrada (antes do login).
 */
const CAMINHO = "/api/crianca-proxy/voz";
/** Igual a `teia.voz.max_chars` no backend. */
const MAX_CHARS = 300;
const TEMPO_MAXIMO_MS = 3000;
/** Depois de um 204/erro, não pergunta de novo tão cedo (provedor desligado, orçamento...). */
export const TTL_SEM_VOZ_MS = 5 * 60_000;

const urls = new Map<string, string>();
const semVoz = new Map<string, number>();
const emVoo = new Map<string, Promise<string | null>>();

/** Espelho de `VozService::normalizar`: trim, espaços colapsados e minúsculas pt-BR. */
export function normalizarParaVoz(texto: string): string {
  return texto.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

/** Síncrono: URL já conhecida, para tocar dentro do gesto do toque (Safari) sem esperar nada. */
export function urlEmCache(texto: string): string | null {
  return urls.get(normalizarParaVoz(texto)) ?? null;
}

/**
 * URL do MP3 desta frase, ou null (desativada, longa demais, tempo esgotado,
 * 204 ou erro). Nunca rejeita. Pedidos iguais em paralelo viram um só.
 */
export function obterUrlDeVoz(texto: string, tempoMaximoMs = TEMPO_MAXIMO_MS): Promise<string | null> {
  const chave = normalizarParaVoz(texto);

  if (chave === "" || chave.length > MAX_CHARS || typeof fetch !== "function") {
    return Promise.resolve(null);
  }

  const conhecida = urls.get(chave);

  if (conhecida) return Promise.resolve(conhecida);

  const expira = semVoz.get(chave);

  if (expira !== undefined) {
    if (expira > Date.now()) return Promise.resolve(null);
    semVoz.delete(chave);
  }

  const pendente = emVoo.get(chave);

  if (pendente) return pendente;

  const busca = buscar(chave, tempoMaximoMs).finally(() => emVoo.delete(chave));
  emVoo.set(chave, busca);

  return busca;
}

async function buscar(chave: string, tempoMaximoMs: number): Promise<string | null> {
  // AbortController + setTimeout, não AbortSignal.timeout (não existe em Safari < 16).
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), tempoMaximoMs);

  try {
    const res = await fetch(`${CAMINHO}?${new URLSearchParams({ texto: chave })}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controle.signal,
    });

    if (res.status === 200) {
      const corpo = (await res.json()) as { url?: unknown };

      if (typeof corpo.url === "string" && corpo.url !== "") {
        urls.set(chave, corpo.url);

        return corpo.url;
      }
    }
  } catch {
    // Tempo esgotado: o backend pode ter acabado de gerar o arquivo, então não
    // marca "sem voz" — a próxima tentativa encontra o MP3 já pronto.
    if (controle.signal.aborted) return null;
  } finally {
    clearTimeout(limite);
  }

  semVoz.set(chave, Date.now() + TTL_SEM_VOZ_MS);

  return null;
}

/** Dispara as buscas em paralelo e ignora o resultado: aquece uma sequência ou uma tela. */
export function preaquecerVozes(textos: string[]): void {
  for (const texto of textos) {
    void obterUrlDeVoz(texto);
  }
}

/** Só para testes. */
export function limparCacheDeVozes(): void {
  urls.clear();
  semVoz.clear();
  emVoo.clear();
}
