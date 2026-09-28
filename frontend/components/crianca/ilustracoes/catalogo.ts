/**
 * Catálogo das cenas desenhadas pelo app (Temporada 1). É só dado: o painel
 * usa para o seletor de ilustração e o app da criança carrega os desenhos sob
 * demanda (cenas.tsx). A chave é o que o conteúdo guarda em `ilustracao`
 * (aula, página da história, atividade); chave desconhecida cai no ícone.
 *
 * Personagens ORIGINAIS (docs/temporada-1.md): nunca desenhar personagem,
 * marca ou logotipo de outra obra.
 */
export type GrupoIlustracao = "capas" | "portugues" | "matematica" | "geografia" | "historia";

export type ItemCatalogo = { chave: string; rotulo: string; grupo: GrupoIlustracao };

export const CATALOGO_ILUSTRACOES = [
  { chave: "capa-teia", rotulo: "A nave Teia resgata o robô-tatu", grupo: "capas" },
  { chave: "capa-boneca", rotulo: "A boneca-robô de boné vermelho", grupo: "capas" },
  { chave: "capa-somar", rotulo: "Caixas de suprimentos e o foguete", grupo: "capas" },
  { chave: "capa-casa", rotulo: "A casa e a rua do capitão", grupo: "capas" },

  { chave: "boneca-oficina", rotulo: "Luz piscando na oficina, de noite", grupo: "portugues" },
  { chave: "boneca-sozinha", rotulo: "A boneca-robô sozinha, sem o boné", grupo: "portugues" },
  { chave: "boneca-bone", rotulo: "O boné achado (e uma gosma no canto)", grupo: "portugues" },
  { chave: "gosma-aparece", rotulo: "A Gosma come as letras da placa", grupo: "portugues" },
  { chave: "gosma-arroto", rotulo: "A Gosma arrota as letras na antena", grupo: "portugues" },
  { chave: "bip-pulo", rotulo: "O mascote dá um pulo na lua", grupo: "portugues" },

  { chave: "cubo-ponte", rotulo: "Planeta Cubo: a ponte comida pela Gosma", grupo: "matematica" },
  { chave: "cubo-pilhas", rotulo: "Planeta Cubo: uma pilha de 10 e blocos soltos", grupo: "matematica" },

  { chave: "mapa-bairro", rotulo: "O bairro visto de cima, com rastro de gosma", grupo: "geografia" },

  { chave: "diario-espirro", rotulo: "A Gosma espirra no diário de bordo", grupo: "historia" },
  { chave: "diario-tempo", rotulo: "Ontem, hoje e amanhã no diário", grupo: "historia" },
] as const satisfies readonly ItemCatalogo[];

export type ChaveIlustracao = (typeof CATALOGO_ILUSTRACOES)[number]["chave"];

const CHAVES = new Set<string>(CATALOGO_ILUSTRACOES.map((i) => i.chave));

export function existeIlustracao(chave: string | null | undefined): chave is ChaveIlustracao {
  return !!chave && CHAVES.has(chave);
}

export function rotuloIlustracao(chave: string | null | undefined): string | null {
  return CATALOGO_ILUSTRACOES.find((i) => i.chave === chave)?.rotulo ?? null;
}
