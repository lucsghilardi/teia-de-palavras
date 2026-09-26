"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { Pontinhos } from "@/components/crianca/aula/pontinhos";
import { Ilustracao } from "@/components/crianca/aula/ilustracao";
import { useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import type { PropsAtividade } from "@/components/crianca/atividades/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { exibir } from "@/lib/exibir";
import { cn } from "@/lib/utils";
import type { AtividadeHistoria } from "@/types/CriancaApp";

/**
 * HISTÓRIA: páginas de tela cheia. A narração toca sozinha em cada página;
 * o texto aparece grande, mas a criança escuta.
 */
export function Historia({ aula, atividade, minusculas, aoConcluir, definirInstrucao }: PropsAtividade<AtividadeHistoria>) {
  const paginas =
    atividade.paginas.length > 0
      ? atividade.paginas
      : [{ texto: atividade.titulo ?? aula.titulo, imagem_url: atividade.imagem_url ?? aula.palavra_imagem_url, audio_url: null }];
  const [pagina, setPagina] = useState(0);
  const atual = paginas[Math.min(pagina, paginas.length - 1)];
  const primeira = pagina === 0;
  const ultima = pagina >= paginas.length - 1;
  const trecho = { texto: atual.texto, audio_url: atual.audio_url };
  const narrou = useNarracaoDeChegada(`pagina-${pagina}`, [trecho], trecho, definirInstrucao);

  return (
    <section aria-label="História da missão" className="flex flex-1 flex-col gap-3 px-3 pb-4 sm:gap-4 sm:px-6">
      <div
        key={pagina}
        className="animate-crianca-entrar flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 landscape:flex-row landscape:items-stretch"
      >
        <div className="relative min-h-[36vh] flex-1 landscape:min-h-[40vh]">
          <Ilustracao key={atual.imagem_url ?? "sem-imagem"} src={atual.imagem_url} icone={atual.icone ?? "rocket"} className="absolute inset-0" />
        </div>
        <p
          className={cn(
            "rounded-[2rem] bg-[var(--c-superficie)] px-5 py-4 text-center font-extrabold leading-snug shadow-[0_6px_0_var(--c-borda)]",
            "text-[clamp(1.25rem,3.4vw,2.25rem)] landscape:flex landscape:flex-1 landscape:items-center landscape:justify-center",
          )}
        >
          {exibir(atual.texto, minusculas)}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
        <BotaoGrande
          rotulo="Anterior"
          cor="neutra"
          tamanho={80}
          className={cn(primeira && "invisible")}
          disabled={primeira}
          onClick={() => setPagina((p) => Math.max(0, p - 1))}
        >
          <ArrowLeft className="size-10" strokeWidth={3} aria-hidden />
        </BotaoGrande>

        <Pontinhos total={paginas.length} atual={pagina} />

        {ultima ? (
          <BotaoContinuar destaque={narrou} onClick={aoConcluir} />
        ) : (
          <BotaoGrande
            rotulo="Próximo"
            cor="primaria"
            tamanho={88}
            destaque={narrou}
            className="px-8"
            onClick={() => setPagina((p) => Math.min(paginas.length - 1, p + 1))}
          >
            <ArrowRight className="size-11" strokeWidth={3} aria-hidden />
          </BotaoGrande>
        )}
      </div>
    </section>
  );
}
