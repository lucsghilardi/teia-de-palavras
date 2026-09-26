import { describe, expect, it, vi } from "vitest";

import { criarSincronizador } from "./sincronia";

/** Servidor falso que segue o contrato: 422 se pular etapa. */
function servidorFalso(inicial = 1) {
  let etapaAtual = inicial;
  const chamadas: number[] = [];
  const falhas = new Map<number, number>(); // etapa → quantas vezes falhar

  const enviar = vi.fn(async (n: number) => {
    chamadas.push(n);
    const restantes = falhas.get(n) ?? 0;

    if (restantes > 0) {
      falhas.set(n, restantes - 1);
      throw new Error("rede");
    }

    if (n > etapaAtual) throw new Error("422");

    etapaAtual = Math.max(etapaAtual, n + 1);

    return { etapa_atual: etapaAtual };
  });

  return { enviar, chamadas, falhas, atual: () => etapaAtual };
}

describe("criarSincronizador", () => {
  it("envia as etapas em ordem mesmo quando pedidas sem esperar", async () => {
    const srv = servidorFalso(1);
    const sinc = criarSincronizador(srv.enviar, 1, 8);

    const r = await Promise.all([sinc.concluir(1), sinc.concluir(2), sinc.concluir(3)]);

    expect(r).toEqual([true, true, true]);
    expect(srv.chamadas).toEqual([1, 2, 3]);
    expect(srv.atual()).toBe(4);
    expect(sinc.confirmada()).toBe(4);
  });

  it("tenta de novo uma vez", async () => {
    const srv = servidorFalso(1);
    srv.falhas.set(1, 1);
    const sinc = criarSincronizador(srv.enviar, 1, 8);

    expect(await sinc.concluir(1)).toBe(true);
    expect(srv.chamadas).toEqual([1, 1]);
  });

  it("depois de falhar duas vezes, o próximo pedido recupera o atraso", async () => {
    const srv = servidorFalso(1);
    srv.falhas.set(1, 2);
    const aoConfirmar = vi.fn();
    const sinc = criarSincronizador(srv.enviar, 1, 8, aoConfirmar);

    expect(await sinc.concluir(1)).toBe(false);
    expect(sinc.confirmada()).toBe(1);

    expect(await sinc.concluir(2)).toBe(true);
    expect(srv.chamadas).toEqual([1, 1, 1, 2]);
    expect(srv.atual()).toBe(3);
    expect(aoConfirmar).toHaveBeenLastCalledWith(3);
  });

  it("não reenvia etapas que o servidor já passou", async () => {
    const srv = servidorFalso(5);
    const sinc = criarSincronizador(srv.enviar, 5, 8);

    expect(await sinc.concluir(2)).toBe(true);
    expect(srv.chamadas).toEqual([]);
  });

  it("nunca envia a conquista (etapa N+1): a conclusão é outra rota", async () => {
    const srv = servidorFalso(7);
    const sinc = criarSincronizador(srv.enviar, 7, 8);

    expect(await sinc.concluir(8)).toBe(true);
    expect(srv.chamadas).toEqual([7]);
    expect(sinc.confirmada()).toBe(8);
  });

  it("respeita o total da missão (uma missão de 3 atividades para na 3)", async () => {
    const srv = servidorFalso(1);
    const sinc = criarSincronizador(srv.enviar, 1, 4);

    expect(await sinc.concluir(4)).toBe(true);
    expect(srv.chamadas).toEqual([1, 2, 3]);
    expect(sinc.confirmada()).toBe(4);
  });
});
