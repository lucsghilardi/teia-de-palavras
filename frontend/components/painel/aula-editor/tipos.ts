import type { AulaMidiaAlvo } from "@/types/Aula";

/** Envio/remoção imediata de mídia da aula (o editor aplica a URL no estado). */
export type MidiaHandlers = {
  enviar: (alvo: AulaMidiaAlvo, alvoId: number | undefined, arquivo: File) => Promise<void>;
  remover: (alvo: AulaMidiaAlvo, alvoId: number | undefined) => Promise<void>;
};

export const DICA_SALVAR_PARA_MIDIA = "Salve para enviar mídia.";
