/*
| Frases visíveis/faladas do app da criança que não vêm do conteúdo: curtas,
| sem diminutivos, tom de missão espacial. Telas novas leem daqui; as antigas
| migram conforme são tocadas.
*/
export const COPY = {
  galaxia: {
    titulo: "Galáxia",
    ola: (apelido: string) => `Oi, ${apelido}!`,
    instrucao: "Escolha um planeta ou uma missão do dia.",
    erro: "Não consegui abrir a Galáxia. Toque no botão para tentar de novo.",
    escolhasDoDia: "Missões do dia",
    planetas: "Planetas",
    emBreve: "Em breve",
    amigos: "Base dos amigos",
    amigosEmBreve: "Em breve: aulas dos seus amigos.",
    perfil: "Meu perfil",
    revisao: "Revisão",
  },
  planeta: {
    voltar: "Voltar à Galáxia",
    instrucao: (nome: string) => `Planeta ${nome}. Escolha a sua missão.`,
    erro: "Não consegui abrir o planeta. Toque no botão para tentar de novo.",
    vazio: "Ainda não tem missão neste planeta. Volte logo!",
    trancada: "Essa missão ainda está trancada. Termine a anterior.",
    teia: "Minha Teia de Palavras",
  },
  missao: {
    voltar: "Voltar ao planeta",
    trancada: "Essa missão ainda está trancada",
    falha: "Não consegui abrir a missão. Vamos tentar de novo?",
    concluida: "Missão concluída!",
    proxima: "Próxima missão",
  },
  comum: {
    continuar: "Continuar",
    proximo: "Próximo",
    tentarDeNovo: "Tentar de novo",
    ouvirDeNovo: "Ouvir de novo",
    voltar: "Voltar",
    pontos: (n: number) => (n === 1 ? "1 ponto" : `${n} pontos`),
  },
} as const;
