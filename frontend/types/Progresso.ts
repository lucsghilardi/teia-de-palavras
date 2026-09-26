import type { Conquista } from "./CriancaApp";
import type { OpcaoVisual } from "./OpcaoVisual";

// Progresso de uma criança (docs/api-painel.md). Só o caminho dela: nunca comparação.

export interface Progresso {
  crianca: { id: number; apelido: string; avatar: OpcaoVisual | null; turma: { id: number; nome: string } | null };
  xp: { xp: number; nivel: number; xp_no_nivel: number; xp_para_proximo: number | null };
  sequencia: { atual: number; maior: number; ultimo_dia_ativo: string | null };
  missoes: {
    por_disciplina: { chave: string; nome: string; cor: string; icone: string; publicadas: number; concluidas: number; em_andamento: number }[];
    ultimas: {
      id: number;
      rotulo: string;
      titulo: string;
      disciplina: string;
      status: "em_andamento" | "concluida" | string;
      etapa_atual: number;
      total_atividades: number;
      iniciada_em: string | null;
      concluida_em: string | null;
    }[];
  };
  teia: { total: number; ultimas: { palavra: string; origem: string; descoberta_em: string | null }[] };
  revisao: { itens: number; dominados: number; devidos: number; acertos: number; erros: number };
  respostas: { itens: number; acertou: number; acertou_na_primeira: number };
  mini_aulas: { dadas: number; aprovadas: number; recebidas: number; respondidas: number };
  rodas: { participou: number };
  medalhas: { total: number; desbloqueadas: number; ultimas: (Conquista & { desbloqueada_em: string | null })[] };
  uso: { dias_ativos_30d: number; minutos_30d: number };
}
