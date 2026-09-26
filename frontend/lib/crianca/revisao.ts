import type { AulaCrianca, ItemRevisao } from "@/types/CriancaApp";

/**
 * A Revisão reaproveita os componentes das atividades, que esperam uma
 * "aula". Cada item vira uma missão virtual de uma atividade só.
 */
export function aulaDaRevisao(item: ItemRevisao): AulaCrianca {
  return {
    id: 0,
    titulo: "Revisão",
    descricao: null,
    disciplina: item.disciplina,
    rotulo: "Revisão",
    fase: 0,
    palavra_geradora: null,
    palavra_imagem_url: null,
    palavra_audio_url: null,
    status: "em_andamento",
    etapa_atual: 1,
    total_atividades: 1,
    atividades: [item.atividade],
  };
}

/** O que dizer no fim da sessão. Conta o que foi feito; nunca nota nem acertos versus erros. */
export function resumoDaRevisao(feitos: number, xp: number, restantes: number): string {
  const itens = feitos === 1 ? "1 item" : `${feitos} itens`;
  const partes = [`Revisão feita! Você revisou ${itens}.`];

  if (xp > 0) partes.push(xp === 1 ? "Ganhou 1 ponto." : `Ganhou ${xp} pontos.`);
  partes.push(restantes > 0 ? "Ainda tem mais para revisar hoje." : "Amanhã tem mais.");

  return partes.join(" ");
}

/** Texto do cartão/botão da Revisão no mapa e na tela "eu". */
export function rotuloRevisao(devidos: number): string {
  if (devidos <= 0) return "Revisão em dia";

  return devidos === 1 ? "Revisão: 1 item para hoje" : `Revisão: ${devidos} itens para hoje`;
}
