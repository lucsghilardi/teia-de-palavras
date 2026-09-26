import { ApiError } from "@/services/apiError";

/**
 * Mensagem para feedback: a do `ApiError` (em 422, o primeiro erro de
 * validação) ou o texto padrão da tela.
 */
export function mensagemDeErro(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Todas as mensagens de um erro (ex.: o que falta para publicar uma aula).
 * Sem `errors` por campo, usa o `message` do corpo.
 */
export function mensagensDeErro(error: unknown, fallback: string): string[] {
  if (!(error instanceof ApiError)) {
    return [fallback];
  }

  const porCampo = error.body?.errors
    ? Object.values(error.body.errors).flat().filter(Boolean)
    : [];

  if (porCampo.length > 0) {
    return porCampo;
  }

  return [error.body?.message || error.message || fallback];
}
