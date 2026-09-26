import type { Trecho } from "@/components/crianca/aula/narrador";
import type { Atividade, AulaCrianca, Conquista, ResultadoConclusao } from "@/types/CriancaApp";

/** O que todo componente de atividade recebe do player. */
export type PropsAtividade<T extends Atividade = Atividade> = {
  aula: AulaCrianca;
  atividade: T;
  /** Criança lê em minúsculas (config do educador). Todo texto passa por exibir(). */
  minusculas: boolean;
  /** A criança terminou esta atividade: o player avança (e avisa o servidor). */
  aoConcluir: () => void;
  /** O que o alto-falante do topo repete. */
  definirInstrucao: (instrucao: Trecho) => void;
  /** Aviso rápido de conquistas novas (medalhas). */
  mostrarConquistas: (conquistas: Conquista[]) => void;
  /** Palavra válida formada (Português): marca a meta e põe na Teia da missão. */
  aoDescobrir: (palavra: string, audioUrl: string | null) => void;
};

/** A tela de conquista (etapa N+1) não é uma atividade: recebe só o que precisa. */
export type PropsConquista = {
  aula: AulaCrianca;
  minusculas: boolean;
  definirInstrucao: (instrucao: Trecho) => void;
  mostrarConquistas: (conquistas: Conquista[]) => void;
  concluirMissao: () => Promise<ResultadoConclusao | null>;
  estrelasNoInicio: number | null;
};
