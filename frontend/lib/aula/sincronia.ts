/**
 * Envio otimista do progresso (POST /aulas/{id}/etapas/{n}/concluir).
 *
 * A tela avança na hora; aqui os envios entram numa FILA (o servidor recusa
 * pular etapas, então a ordem importa). Cada envio tenta de novo uma vez. Se
 * ainda assim falhar, a fila guarda de onde parou e o próximo pedido reenvia
 * as etapas que faltaram antes da nova ("recupera o atraso").
 */
export type EnviarEtapa = (etapa: number) => Promise<{ etapa_atual: number }>;

export type Sincronizador = {
  /** Garante que o servidor saiba que a etapa `etapa` (1..7) terminou. true = confirmado. */
  concluir: (etapa: number) => Promise<boolean>;
  /** etapa_atual que o servidor já confirmou. */
  confirmada: () => number;
};

const ULTIMA_ETAPA_CONCLUIVEL = 7;

export function criarSincronizador(
  enviar: EnviarEtapa,
  etapaDoServidor: number,
  aoConfirmar?: (etapaAtual: number) => void,
): Sincronizador {
  let confirmada = Math.max(1, Math.trunc(etapaDoServidor) || 1);
  let fila: Promise<unknown> = Promise.resolve();

  async function enviarComRetentativa(etapa: number): Promise<{ etapa_atual: number } | null> {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        return await enviar(etapa);
      } catch {
        // tenta de novo uma vez; depois desiste sem travar a criança
      }
    }

    return null;
  }

  function concluir(etapa: number): Promise<boolean> {
    const alvo = Math.min(ULTIMA_ETAPA_CONCLUIVEL, Math.trunc(etapa));

    const passo = fila.then(async () => {
      while (confirmada <= alvo) {
        const enviada = confirmada;
        const resposta = await enviarComRetentativa(enviada);

        if (!resposta) return false;

        confirmada = Math.max(enviada + 1, Math.trunc(resposta.etapa_atual) || 0);
        aoConfirmar?.(confirmada);
      }

      return true;
    });

    fila = passo.catch(() => false);

    return passo;
  }

  return { concluir, confirmada: () => confirmada };
}
