import type { Atividade, ResultadoResposta, ResultadoTentativa } from "@/types/CriancaApp";
import type { DuplaEstado, TentativaDupla } from "@/types/Roda";

/** O par de `eu` na dupla (null se eu não estou nela). */
export function parceiro(dupla: DuplaEstado, eu: number) {
  if (!dupla.criancas.some((c) => c.id === eu)) return null;

  return dupla.criancas.find((c) => c.id !== eu) ?? null;
}

export const ehMinhaVez = (dupla: DuplaEstado, eu: number) => dupla.vez_de === eu;

/** A proposta esperando resposta, se houver. */
export function propostaAberta(dupla: DuplaEstado | null): TentativaDupla | null {
  return dupla?.tentativa && dupla.tentativa.status === "proposta" ? dupla.tentativa : null;
}

/** Como falar/mostrar a resposta proposta pelo par, com o mesmo conteúdo que ele viu. */
export function descreverResposta(atividade: Atividade | null, resposta: Record<string, unknown>): string {
  const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const lista = (v: unknown) => (Array.isArray(v) ? v.map(texto) : []);

  if (!atividade) return lista(resposta.silabas).join("-") || texto(resposta.valor) || texto(resposta.opcao);

  switch (atividade.tipo) {
    case "montar_palavras":
    case "ditado":
      return lista(resposta.silabas).join("-");
    case "escolha":
    case "verdadeiro_falso": {
      const item = atividade.itens.find((i) => i.id === resposta.item) ?? atividade.itens[0];
      const opcao = item?.opcoes.find((o) => o.id === resposta.opcao);

      return opcao?.texto ?? texto(resposta.opcao);
    }
    case "contar":
    case "somar_subtrair":
      return texto(resposta.valor);
    case "escolher_silaba":
      return texto(resposta.silaba);
    case "ordenar":
    case "linha_do_tempo": {
      const porId = new Map(atividade.itens.map((i) => [i.id, i.texto]));

      return lista(resposta.ordem)
        .map((id) => porId.get(id) ?? id)
        .join(", ");
    }
    case "parear": {
      const a = atividade.esquerda.find((i) => i.id === resposta.item)?.texto ?? texto(resposta.item);
      const b = atividade.direita.find((i) => i.id === resposta.b)?.texto ?? texto(resposta.b);

      return `${a} e ${b}`;
    }
    case "dinheiro": {
      const item = atividade.itens.find((i) => i.id === resposta.item) ?? atividade.itens[0];
      const valores = lista(resposta.escolhidas).map((id) => item?.moedas.find((m) => m.id === id)?.valor ?? 0);
      const soma = valores.reduce((s, v) => s + v, 0);

      return soma > 0 ? `${soma} reais` : lista(resposta.escolhidas).join(", ");
    }
    case "mapa_pontos":
      return atividade.pontos.find((p) => p.chave === resposta.ponto)?.rotulo ?? texto(resposta.ponto);
    default:
      return "";
  }
}

/** Quando o par diz "vamos mudar", quem propôs vê isto no lugar da avaliação (nada foi conferido). */
export function respostaDeMudar(apelido: string, item: string, totais: { xp_total: number; nivel: number }): ResultadoResposta {
  return {
    correta: false,
    item,
    mensagem: `${apelido} quer tentar de outro jeito.`,
    dica: "conversem e proponham outra resposta.",
    resposta_correta: null,
    xp_ganho: 0,
    tentativas: 0,
    resolvido: false,
    revisao_agendada: false,
    extra: {},
    xp_total: totais.xp_total,
    nivel: totais.nivel,
    conquistas: [],
  };
}

export function tentativaDeMudar(apelido: string, silabas: string[], totais: { estrelas: number; teia_total: number }): ResultadoTentativa {
  return {
    valida: false,
    tipo: "quase",
    palavra: null,
    silabas,
    nova_na_teia: false,
    dica: `${apelido} quer tentar de outro jeito. Conversem e montem outra palavra.`,
    audio_url: null,
    teia_total: totais.teia_total,
    estrelas: totais.estrelas,
    conquistas: [],
  };
}

/** O que dizer sobre uma proposta já respondida (para o par que confirmou). */
export function falaDoResultado(tentativa: TentativaDupla, tipo: Atividade["tipo"] | null): string {
  if (tentativa.status === "recusada") return "Vocês vão tentar de outro jeito.";

  const r = tentativa.resultado;

  if (tipo === "montar_palavras") {
    const t = r as ResultadoTentativa | null;

    return t?.valida && t.palavra ? `Isso! ${t.palavra} entrou na teia de vocês dois.` : (t?.dica ?? tentativa.dica ?? "não foi dessa vez.");
  }

  const rr = r as ResultadoResposta | null;

  if (rr?.correta) return rr.mensagem || "Isso! Vocês acertaram juntos.";

  return [rr?.mensagem, rr?.dica ?? tentativa.dica].filter(Boolean).join(" ") || "não foi dessa vez.";
}

/** "Etapa n de N" do topo da roda. */
export function rotuloEtapa(etapa: number, total: number): string {
  return etapa >= total ? "Conquista" : `Etapa ${etapa} de ${total}`;
}
