import { juntarSilabas, separarSilabas } from "@/lib/silabas";
import type { Aula, AulaAtividade, UpdateAulaPayload } from "@/types/Aula";
import type { Disciplina } from "@/types/CriancaApp";

import { nomeDoTipo } from "./modelos-atividade";

// Estado local do editor de aula. Cada item tem uma `chave` estável para o
// React (itens novos ainda não têm id); o `id` só existe depois de salvo.

export type SilabaRascunho = {
  chave: string;
  texto: string;
  familia: string[];
};

export type PaginaRascunho = {
  chave: string;
  id?: number;
  texto: string;
  imagem_url: string | null;
  audio_url: string | null;
};

export type PerguntaRascunho = {
  chave: string;
  id?: number;
  texto: string;
  audio_url: string | null;
};

export type PalavraRascunho = {
  chave: string;
  id?: number;
  palavra: string;
  /** Sílabas como digitadas ("TA-TU"); separadas no salvar. */
  silabas: string;
  destaque: boolean;
  imagem_url: string | null;
  audio_url: string | null;
};

export type AtividadeRascunho = {
  chave: string;
  id?: number;
  tipo: string;
  titulo: string;
  instrucao: string;
  /** JSON como digitado; validado ao salvar (e pelo backend, por tipo). */
  config: string;
  imagem_url: string | null;
  avaliada: boolean;
};

export type AulaRascunho = {
  disciplina: Disciplina;
  titulo: string;
  palavra_geradora: string;
  rotulo: string;
  descricao: string;
  habilidade_bncc: string;
  fase: number;
  pre_requisito_aula_id: number | null;
  silabas: SilabaRascunho[];
  historia_paginas: PaginaRascunho[];
  perguntas: PerguntaRascunho[];
  palavras: PalavraRascunho[];
  atividades: AtividadeRascunho[];
};

let sequencia = 0;

/** Chave de React para item novo (só chamada em handlers, nunca no render). */
export function novaChave(prefixo: string) {
  sequencia += 1;

  return `${prefixo}-novo-${sequencia}`;
}

function porOrdem<T extends { ordem: number }>(itens: T[]) {
  return [...itens].sort((a, b) => a.ordem - b.ordem);
}

export function configParaTexto(config: Record<string, unknown> | null | undefined): string {
  const objeto = config && typeof config === "object" && !Array.isArray(config) ? config : {};

  return Object.keys(objeto).length === 0 ? "{}" : JSON.stringify(objeto, null, 2);
}

/** JSON do config → objeto; `null` quando o texto não é um objeto JSON válido. */
export function configDoTexto(texto: string): Record<string, unknown> | null {
  const limpo = texto.trim();

  if (limpo === "") return {};

  try {
    const valor: unknown = JSON.parse(limpo);

    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function atividadeRascunho(atividade: AulaAtividade): AtividadeRascunho {
  return {
    chave: `atividade-${atividade.id}`,
    id: atividade.id,
    tipo: atividade.tipo,
    titulo: atividade.titulo ?? "",
    instrucao: atividade.instrucao ?? "",
    config: configParaTexto(atividade.config),
    imagem_url: atividade.imagem_url,
    avaliada: atividade.avaliada,
  };
}

/** Converte a aula do backend no estado editável (determinístico). */
export function rascunhoDaAula(aula: Aula): AulaRascunho {
  return {
    disciplina: aula.disciplina,
    titulo: aula.titulo,
    palavra_geradora: aula.palavra_geradora ?? "",
    rotulo: aula.rotulo ?? "",
    descricao: aula.descricao ?? "",
    habilidade_bncc: aula.habilidade_bncc ?? "",
    fase: aula.fase,
    pre_requisito_aula_id: aula.pre_requisito_aula_id,
    silabas: porOrdem(aula.silabas).map((silaba) => ({
      chave: `silaba-${silaba.id}`,
      texto: silaba.texto,
      familia: silaba.familia.map((item) => item.texto),
    })),
    historia_paginas: porOrdem(aula.historia_paginas).map((pagina) => ({
      chave: `pagina-${pagina.id}`,
      id: pagina.id,
      texto: pagina.texto,
      imagem_url: pagina.imagem_url,
      audio_url: pagina.audio_url,
    })),
    perguntas: porOrdem(aula.perguntas).map((pergunta) => ({
      chave: `pergunta-${pergunta.id}`,
      id: pergunta.id,
      texto: pergunta.texto,
      audio_url: pergunta.audio_url,
    })),
    palavras: aula.palavras.map((palavra) => ({
      chave: `palavra-${palavra.id}`,
      id: palavra.id,
      palavra: palavra.palavra,
      silabas: juntarSilabas(palavra.silabas),
      destaque: palavra.destaque,
      imagem_url: palavra.imagem_url,
      audio_url: palavra.audio_url,
    })),
    atividades: porOrdem(aula.atividades).map(atividadeRascunho),
  };
}

function comId<T extends object>(id: number | undefined, dados: T): T & { id?: number } {
  return id === undefined ? dados : { id, ...dados };
}

function textoOuNulo(valor: string): string | null {
  const texto = valor.trim();

  return texto === "" ? null : texto;
}

/**
 * Documento do PUT /painel/aulas/{id}: ordem = posição no array; filhos com
 * id são mantidos, sem id são criados. Palavra com sílabas vazias vai com
 * `silabas: []` e o backend separa sozinho. Os campos de Português só vão
 * quando a aula é de Português. Config inválido vai como `{}` (o
 * `validarRascunho` impede salvar nesse caso).
 */
export function payloadDoRascunho(rascunho: AulaRascunho): UpdateAulaPayload {
  const base: UpdateAulaPayload = {
    titulo: rascunho.titulo.trim(),
    fase: rascunho.fase,
    pre_requisito_aula_id: rascunho.pre_requisito_aula_id,
    rotulo: textoOuNulo(rascunho.rotulo),
    descricao: textoOuNulo(rascunho.descricao),
    habilidade_bncc: textoOuNulo(rascunho.habilidade_bncc),
    atividades: rascunho.atividades.map((atividade) =>
      comId(atividade.id, {
        tipo: atividade.tipo,
        titulo: textoOuNulo(atividade.titulo),
        instrucao: textoOuNulo(atividade.instrucao),
        config: configDoTexto(atividade.config) ?? {},
      }),
    ),
  };

  if (rascunho.disciplina !== "portugues") {
    return base;
  }

  return {
    ...base,
    palavra_geradora: rascunho.palavra_geradora.trim(),
    silabas: rascunho.silabas.map((silaba) => ({
      texto: silaba.texto.trim(),
      familia: silaba.familia,
    })),
    historia_paginas: rascunho.historia_paginas.map((pagina) =>
      comId(pagina.id, { texto: pagina.texto }),
    ),
    perguntas: rascunho.perguntas.map((pergunta) =>
      comId(pergunta.id, { texto: pergunta.texto }),
    ),
    palavras: rascunho.palavras.map((palavra) =>
      comId(palavra.id, {
        palavra: palavra.palavra.trim(),
        silabas: separarSilabas(palavra.silabas),
        destaque: palavra.destaque,
      }),
    ),
  };
}

/** Problemas que impedem salvar (o resto o backend valida). */
export function validarRascunho(rascunho: AulaRascunho): string[] {
  const erros: string[] = [];
  const portugues = rascunho.disciplina === "portugues";

  if (!rascunho.titulo.trim()) erros.push("Informe o título da aula.");
  if (portugues && !rascunho.palavra_geradora.trim()) erros.push("Informe a palavra geradora.");

  if (portugues && rascunho.silabas.some((silaba) => !silaba.texto.trim())) {
    erros.push("Há sílaba sem texto na aba “Sílabas e famílias”.");
  }

  if (portugues && rascunho.historia_paginas.some((pagina) => !pagina.texto.trim())) {
    erros.push("Há página sem texto na aba “História”.");
  }

  if (portugues && rascunho.perguntas.some((pergunta) => !pergunta.texto.trim())) {
    erros.push("Há pergunta sem texto na aba “Conversa”.");
  }

  if (portugues && rascunho.palavras.some((palavra) => !palavra.palavra.trim())) {
    erros.push("Há palavra sem texto na aba “Dicionário da aula”.");
  }

  rascunho.atividades.forEach((atividade, indice) => {
    if (!atividade.tipo) {
      erros.push(`A atividade ${indice + 1} está sem tipo.`);
    }

    if (configDoTexto(atividade.config) === null) {
      erros.push(`O JSON da atividade ${indice + 1} (${nomeDoTipo(atividade.tipo)}) não é válido.`);
    }
  });

  return erros;
}

/** Move um item uma posição para cima (-1) ou para baixo (+1). */
export function moverItem<T>(lista: T[], indice: number, delta: -1 | 1): T[] {
  const destino = indice + delta;

  if (destino < 0 || destino >= lista.length) {
    return lista;
  }

  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];

  return copia;
}
