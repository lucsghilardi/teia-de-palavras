import { COPY } from "@/lib/copy";
import type { AulaCrianca, EntregaAberta, EntregaMiniAula, MinhaMiniAula, Reacao } from "@/types/CriancaApp";

/** A mini-aula reaproveita os componentes das atividades: vira uma missão virtual de UM desafio. */
export function aulaDaMiniAula(entrega: EntregaAberta): AulaCrianca {
  return {
    id: 0,
    titulo: entrega.mini_aula.titulo,
    descricao: null,
    disciplina: entrega.mini_aula.disciplina,
    rotulo: entrega.mini_aula.titulo,
    fase: 0,
    palavra_geradora: null,
    palavra_imagem_url: null,
    palavra_audio_url: null,
    status: "em_andamento",
    etapa_atual: 1,
    total_atividades: 1,
    atividades: [entrega.atividade],
  };
}

/** Nome acessível do cartão da Galáxia: com contagem só quando há aula nova. */
export function rotuloCartaoAmigos(novas: number): string {
  if (novas <= 0) return COPY.amigos.titulo;

  return `${COPY.amigos.titulo}: ${novas === 1 ? "1 nova" : `${novas} novas`}`;
}

/** Nome acessível de uma aula recebida ("Aula de Bia: qual sílaba falta em tatu?"). */
export function rotuloAulaAmigo(entrega: EntregaMiniAula): string {
  return `Aula de ${entrega.mini_aula.autor.apelido}: ${entrega.mini_aula.titulo}`;
}

/** O que dizer de uma mini-aula da própria criança: situação e quantos amigos responderam (nunca quem). */
export function resumoDaMinha(mini: MinhaMiniAula): string {
  const partes: string[] = [COPY.amigos.status[mini.status]];

  if (mini.status === "aprovada") {
    partes.push(mini.respondidas === 0 ? "ninguém respondeu ainda" : mini.respondidas === 1 ? "1 amigo respondeu" : `${mini.respondidas} amigos responderam`);
  }

  return partes.join(", ");
}

export const REACOES: Reacao[] = ["valeu", "aprendi", "top"];

/** Total de reações recebidas, por tipo, na ordem fixa. */
export function contagemDeReacoes(mini: MinhaMiniAula): { reacao: Reacao; total: number }[] {
  return REACOES.map((reacao) => ({ reacao, total: mini.reacoes[reacao] ?? 0 })).filter((r) => r.total > 0);
}

/** m:ss do cronômetro do gravador. */
export function relogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
