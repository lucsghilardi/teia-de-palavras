"use client";

import { Ilustracao } from "@/components/crianca/aula/ilustracao";
import { existeIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import type { Atividade } from "@/types/CriancaApp";

/** Tipos que já desenham a própria figura em tela cheia. */
const COM_FIGURA_PROPRIA = new Set<Atividade["tipo"]>(["historia", "palavra"]);

/** A atividade tem uma cena (ou imagem enviada) para mostrar no alto? */
export function temFaixaCena(atividade: Atividade): boolean {
  return !COM_FIGURA_PROPRIA.has(atividade.tipo) && (Boolean(atividade.imagem_url) || existeIlustracao(atividade.ilustracao));
}

/**
 * Faixa baixa com a cena da atividade, acima dela: lembra em que ponto da
 * história a criança está sem empurrar os botões para fora da tela.
 */
export function FaixaCena({ atividade }: { atividade: Atividade }) {
  return (
    <div className="animate-crianca-entrar mx-3 mb-2 h-[clamp(5.5rem,16vh,10rem)] shrink-0 sm:mx-6">
      <Ilustracao src={atividade.imagem_url} chave={atividade.ilustracao} icone="sparkles" />
    </div>
  );
}
