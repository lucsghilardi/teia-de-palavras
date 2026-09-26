import type { Trecho } from "@/components/crianca/aula/narrador";
import type { AulaCrianca, Conquista, ResultadoConclusao } from "@/types/CriancaApp";

/** O que toda etapa recebe do player. */
export type PropsEtapa = {
  aula: AulaCrianca;
  /** Criança lê em minúsculas (config do educador). Todo texto passa por exibir(). */
  minusculas: boolean;
  /** A criança terminou esta etapa: o player avança (e avisa o servidor). */
  aoConcluir: () => void;
  /** O que o alto-falante do topo repete. */
  definirInstrucao: (instrucao: Trecho) => void;
  /** Aviso rápido de conquistas novas (medalhas). */
  mostrarConquistas: (conquistas: Conquista[]) => void;
};

export type PropsCriacao = PropsEtapa & {
  aoDescobrir: (palavra: string, audioUrl: string | null) => void;
};

export type PropsConquista = PropsEtapa & {
  concluirMissao: () => Promise<ResultadoConclusao | null>;
};
