"use client";

import { Play } from "lucide-react";

import { existeIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import { CenaIlustrada } from "@/components/crianca/ilustracoes/cena-ilustrada";
import { ROTULO_STATUS, rotuloMissao } from "@/components/crianca/mapa/no-missao";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Icone } from "@/components/crianca/ui/icone";
import { exibir, exibirPalavra } from "@/lib/exibir";
import type { Missao, Planeta } from "@/types/CriancaApp";

/** Uma "missão do dia": o rótulo grande, o planeta e o estado, na cor do planeta. */
export function CartaoMissao({
  missao,
  planeta,
  minusculas,
  onTocar,
}: {
  missao: Missao;
  planeta: Planeta;
  minusculas: boolean;
  onTocar: (missao: Missao) => void;
}) {
  return (
    <BotaoGrande
      rotulo={rotuloMissao(missao)}
      cor="neutra"
      redondo={false}
      tamanho={96}
      className="w-full justify-start gap-4 px-4 py-3 text-left"
      style={{ boxShadow: `0 6px 0 ${planeta.cor}` }}
      onClick={() => onTocar(missao)}
    >
      <span
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-full text-[var(--c-fundo)]"
        style={{ backgroundColor: planeta.cor }}
      >
        {missao.palavra_imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- host da mídia muda por ambiente
          <img src={missao.palavra_imagem_url} alt="" draggable={false} className="size-full rounded-full object-cover" />
        ) : existeIlustracao(missao.ilustracao) ? (
          <span className="size-full overflow-hidden rounded-full">
            <CenaIlustrada chave={missao.ilustracao} />
          </span>
        ) : (
          <Icone nome={planeta.icone} className="size-9" strokeWidth={2.25} />
        )}
      </span>
      <span aria-hidden className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-2xl font-extrabold sm:text-3xl">{exibirPalavra(missao.rotulo, minusculas)}</span>
        <span className="truncate text-base font-bold text-[var(--c-tinta-suave)]">
          {exibir(`${planeta.nome} · ${ROTULO_STATUS[missao.status]}`, minusculas)}
        </span>
      </span>
      <Play aria-hidden className="size-8 shrink-0 fill-current" style={{ color: planeta.cor }} />
    </BotaoGrande>
  );
}
