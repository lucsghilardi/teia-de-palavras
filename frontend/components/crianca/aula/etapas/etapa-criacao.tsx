"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Check, Eraser } from "lucide-react";
import { motion, useAnimate } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BotaoContinuar } from "@/components/crianca/aula/botao-continuar";
import { celebrar } from "@/components/crianca/aula/celebrar";
import { Ilustracao } from "@/components/crianca/aula/ilustracao";
import { falasDeConquistas, narrar, useNarracaoDeChegada } from "@/components/crianca/aula/narrador";
import { useTratarSessao } from "@/components/crianca/aula/sessao";
import type { PropsCriacao } from "@/components/crianca/aula/tipos";
import { BotaoGrande } from "@/components/crianca/ui/botao-grande";
import { Peca } from "@/components/crianca/ui/peca";
import { useCrianca } from "@/context/CriancaContext";
import { useMovimentoReduzido } from "@/hooks/use-movimento-reduzido";
import { adicionar, BANDEJA_VAZIA, cheia, limpar, MAX_BANDEJA, remover, vazia, type Bandeja } from "@/lib/aula/bandeja";
import { dicaDaCriacao, mesmaPalavra, organizarPecas } from "@/lib/aula/conteudo";
import { exibir } from "@/lib/exibir";
import { sons } from "@/lib/sons";
import { cn } from "@/lib/utils";
import { tentarPalavra } from "@/services/crianca";
import type { AulaCrianca } from "@/types/CriancaApp";

type PecaAula = AulaCrianca["pecas"][number];
type Voo = { id: number; palavra: string; de: { x: number; y: number }; para: { x: number; y: number } };

const INSTRUCAO = {
  texto: "Toque nas pecinhas para montar uma palavra. Depois, toque no botão verde para formar a palavra.",
};

const ANUNCIOS: Announcements = {
  onDragStart: ({ active }) => `Pegou a pecinha ${String(active.data.current?.texto ?? "")}.`,
  onDragOver: ({ over }) => (over ? "Em cima da bandeja." : undefined),
  onDragEnd: ({ active, over }) =>
    over ? `${String(active.data.current?.texto ?? "")} foi para a bandeja.` : "Soltou fora da bandeja.",
  onDragCancel: () => "Cancelado.",
};

const centro = (el: Element) => {
  const r = el.getBoundingClientRect();

  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Peça da paleta: tocar fala e põe na bandeja; segurar e arrastar também funciona. */
function PecaDaPaleta({
  peca,
  minusculas,
  aoTocar,
}: {
  peca: PecaAula;
  minusculas: boolean;
  aoTocar: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `paleta-${peca.texto}`,
    data: { texto: peca.texto },
    attributes: { roleDescription: "pecinha" },
  });

  return (
    <Peca
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      texto={peca.texto}
      minusculas={minusculas}
      rotulo={`Sílaba ${peca.texto}`}
      tamanho="lg"
      onClick={aoTocar}
      className={cn(isDragging && "opacity-40")}
    />
  );
}

/** A bandeja: 4 lugares; tocar numa peça tira ela. Recebe peças arrastadas. */
function AreaBandeja({
  bandeja,
  minusculas,
  aoTirar,
  aoMontar,
}: {
  bandeja: Bandeja;
  minusculas: boolean;
  aoTirar: (indice: number) => void;
  /** Recebe o elemento da bandeja (para o voo da palavra até a Teia). */
  aoMontar: (el: HTMLDivElement | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "bandeja" });

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        aoMontar(el);
      }}
      role="group"
      aria-label="Bandeja"
      className={cn(
        "flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-[2rem] border-4 border-dashed p-2 transition-colors sm:gap-3 sm:p-3",
        isOver ? "border-[var(--c-teia)] bg-[var(--c-teia)]/10" : "border-[var(--c-borda)] bg-white/80",
      )}
    >
      {Array.from({ length: MAX_BANDEJA }, (_, i) => {
        const peca = bandeja[i];

        return peca ? (
          <Peca
            key={`${i}-${peca}`}
            texto={peca}
            minusculas={minusculas}
            tamanho="md"
            rotulo={`Tirar ${peca}`}
            onClick={() => aoTirar(i)}
            className="animate-crianca-entrar sm:min-h-20 sm:min-w-20 sm:text-4xl"
          />
        ) : (
          <div
            key={`vazio-${i}`}
            aria-hidden
            className="size-16 rounded-2xl border-2 border-dashed border-black/10 bg-black/[0.03] sm:size-20"
          />
        );
      })}
    </div>
  );
}

/**
 * Etapa 6 — CRIAÇÃO: juntar sílabas (desta aula e das anteriores) para
 * descobrir palavras. Palavra válida → comemoração, entra na Teia. Inválida →
 * dica gentil falada; a bandeja fica para a criança ajustar.
 */
export function EtapaCriacao({
  aula,
  minusculas,
  aoConcluir,
  definirInstrucao,
  mostrarConquistas,
  aoDescobrir,
}: PropsCriacao) {
  const { crianca, atualizar } = useCrianca();
  const tratarSessao = useTratarSessao();
  const reduzido = useMovimentoReduzido();
  const { daAula, anteriores } = useMemo(() => organizarPecas(aula.pecas), [aula.pecas]);
  const audioDaPeca = useMemo(() => new Map(aula.pecas.map((p) => [p.texto, p.audio_url])), [aula.pecas]);

  const [bandeja, setBandeja] = useState<Bandeja>(BANDEJA_VAZIA);
  const [achadas, setAchadas] = useState<{ palavra: string; audio_url: string | null }[]>([]);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [voo, setVoo] = useState<Voo | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refBandeja = useRef<HTMLDivElement | null>(null);
  const refTeia = useRef<HTMLDivElement | null>(null);
  const [escopoBalanco, balancar] = useAnimate<HTMLDivElement>();
  const montarBandeja = useCallback((el: HTMLDivElement | null) => {
    refBandeja.current = el;
  }, []);

  const narrou = useNarracaoDeChegada("criacao", [INSTRUCAO], INSTRUCAO, definirInstrucao);

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  );

  const podeContinuar = achadas.length > 0 || aula.metas.some((m) => m.encontrada) || aula.metas.length === 0;
  const totalTeia = crianca?.teia_total ?? aula.teia.length;

  const porNaBandeja = (silaba: string) => {
    if (cheia(bandeja)) {
      sons.dica();
      void narrar("A bandeja está cheia! Toque no botão verde ou tire uma pecinha.");

      return;
    }

    void narrar({ texto: silaba, audio_url: audioDaPeca.get(silaba) ?? null });
    setBandeja((b) => adicionar(b, silaba));
  };

  const tocarPeca = (silaba: string) => {
    sons.toque();
    porNaBandeja(silaba);
  };

  const tirar = (indice: number) => {
    sons.toque();
    const silaba = bandeja[indice];

    if (silaba) void narrar({ texto: silaba, audio_url: audioDaPeca.get(silaba) ?? null });

    setBandeja((b) => remover(b, indice));
  };

  const apagar = () => {
    setBandeja(limpar());
    void narrar(vazia(bandeja) ? "A bandeja está vazia. Toque nas pecinhas!" : "Tudo limpo!");
  };

  const dica = () => {
    void narrar(dicaDaCriacao(aula.metas, achadas.map((a) => a.palavra)));
  };

  const formar = async () => {
    if (vazia(bandeja) || enviando) return;

    const silabas = [...bandeja];
    setEnviando(true);

    try {
      const r = await tentarPalavra(aula.id, silabas);

      if (r.valida && r.palavra) {
        const palavra = r.palavra;

        celebrar(reduzido);
        aoDescobrir(palavra, r.audio_url);
        atualizar({ estrelas: r.estrelas, teia_total: r.teia_total });
        setAchadas((lista) =>
          lista.some((a) => mesmaPalavra(a.palavra, palavra)) ? lista : [...lista, { palavra, audio_url: r.audio_url }],
        );

        if (!reduzido && refBandeja.current && refTeia.current) {
          setVoo({ id: Date.now(), palavra, de: centro(refBandeja.current), para: centro(refTeia.current) });
        }

        setBandeja(limpar());

        if (r.conquistas.length > 0) mostrarConquistas(r.conquistas);

        void narrar([
          { texto: palavra, audio_url: r.audio_url },
          { texto: r.nova_na_teia ? "Você descobriu uma palavra! Ela foi para a sua teia." : "Essa já está na sua teia!" },
          ...falasDeConquistas(r.conquistas),
        ]);

        return;
      }

      sons.dica();

      if (r.tipo !== "aguardando_aprovacao" && !reduzido && escopoBalanco.current) {
        void balancar(escopoBalanco.current, { x: [0, -14, 14, -9, 9, -4, 0] }, { duration: 0.5 });
      }

      void narrar(r.dica || "Hmm... Vamos tentar juntar de outro jeito?");
    } catch (erro) {
      if (tratarSessao(erro)) return;

      sons.dica();
      void narrar("Não consegui olhar a palavra agora. Vamos tentar de novo?");
    } finally {
      setEnviando(false);
    }
  };

  const aoComecarArrastar = (e: DragStartEvent) => {
    setArrastando(String(e.active.data.current?.texto ?? ""));
  };

  const aoSoltar = (e: DragEndEvent) => {
    setArrastando(null);
    const silaba = e.active.data.current?.texto;

    if (e.over?.id === "bandeja" && typeof silaba === "string") {
      sons.toque();
      porNaBandeja(silaba);
    }
  };

  const grupoPecas = (pecas: PecaAula[]) =>
    pecas.map((p) => <PecaDaPaleta key={p.texto} peca={p} minusculas={minusculas} aoTocar={() => tocarPeca(p.texto)} />);

  return (
    <DndContext
      id="criacao-palavras"
      sensors={sensores}
      onDragStart={aoComecarArrastar}
      onDragEnd={aoSoltar}
      onDragCancel={() => setArrastando(null)}
      accessibility={{
        announcements: ANUNCIOS,
        screenReaderInstructions: { draggable: "Toque para ouvir e pôr na bandeja, ou segure e arraste até a bandeja." },
      }}
    >
      <section
        aria-label="Criar palavras"
        className="flex flex-1 flex-col gap-4 px-3 pb-4 sm:px-6 md:landscape:grid md:landscape:grid-cols-2 md:landscape:items-start lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
      >
        {/* Coluna 1: metas, bandeja, botões e palavras achadas */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <ul
              aria-label="Palavras escondidas da missão"
              className="order-2 flex w-full flex-wrap items-center justify-center gap-2 sm:order-1 sm:w-auto sm:min-w-0 sm:flex-1 sm:justify-start"
            >
              {aula.metas.map((m, i) => (
                <li key={`${m.palavra}-${i}`}>
                  {m.encontrada ? (
                    <button
                      type="button"
                      aria-label={`Palavra ${m.palavra}`}
                      onClick={() => {
                        sons.toque();
                        void narrar({ texto: m.palavra, audio_url: m.audio_url });
                      }}
                      className="animate-crianca-entrar flex h-16 min-w-16 items-center gap-1.5 rounded-2xl bg-white px-2 shadow-[0_4px_0_var(--c-grama-sombra)] ring-2 ring-[var(--c-grama)] touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
                    >
                      {m.imagem_url && (
                        <span className="relative size-12 shrink-0">
                          <Ilustracao src={m.imagem_url} emoji="⭐" className="absolute inset-0 rounded-xl" />
                        </span>
                      )}
                      <span className="text-lg font-black">{exibir(m.palavra, minusculas)}</span>
                    </button>
                  ) : (
                    <div
                      role="img"
                      aria-label="Palavra escondida"
                      className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--c-borda)] bg-white/60 text-3xl"
                    >
                      {/* Neutro de propósito: vermelho soa como "errado" para quem tem 6 anos. */}
                      <span aria-hidden className="text-3xl font-black text-[var(--c-teia)] opacity-50">?</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <BotaoGrande rotulo="Dica" cor="sol" tamanho={64} onClick={dica} className="order-1 shrink-0 px-3 sm:order-2">
              <span aria-hidden className="text-3xl leading-none">
                💡
              </span>
            </BotaoGrande>

            <div
              ref={refTeia}
              role="img"
              aria-label={`${totalTeia} palavras na teia`}
              className="order-1 ml-auto flex h-16 shrink-0 items-center gap-1 rounded-2xl bg-[var(--c-teia)] px-3 text-2xl font-black text-white shadow-[0_4px_0_var(--c-teia-sombra)] sm:order-3 sm:ml-0"
            >
              <span aria-hidden>🕸️</span>
              <span aria-hidden key={totalTeia} className="animate-crianca-entrar">
                {totalTeia}
              </span>
            </div>
          </div>

          <div ref={escopoBalanco}>
            <AreaBandeja bandeja={bandeja} minusculas={minusculas} aoTirar={tirar} aoMontar={montarBandeja} />
          </div>

          <div className="flex items-center justify-center gap-4">
            <BotaoGrande rotulo="Apagar" cor="branco" tamanho={80} onClick={apagar}>
              <Eraser className="size-9" strokeWidth={2.5} aria-hidden />
            </BotaoGrande>
            <BotaoGrande
              rotulo="Formar palavra"
              cor="grama"
              tamanho={96}
              // Durante o envio fica visivelmente desabilitado: um toque rápido
              // não pode "sumir" sem resposta.
              disabled={vazia(bandeja) || enviando}
              destaque={bandeja.length >= 2 && !enviando}
              aria-busy={enviando || undefined}
              onClick={() => void formar()}
            >
              <Check className="size-12" strokeWidth={3.5} aria-hidden />
            </BotaoGrande>
          </div>

          {achadas.length > 0 && (
            <ul aria-label="Palavras que você descobriu agora" className="flex flex-wrap justify-center gap-2">
              {achadas.map((a) => (
                <li key={a.palavra}>
                  <button
                    type="button"
                    aria-label={`Palavra ${a.palavra} na teia`}
                    onClick={() => {
                      sons.toque();
                      void narrar({ texto: a.palavra, audio_url: a.audio_url });
                    }}
                    className="animate-crianca-entrar flex min-h-16 items-center gap-2 rounded-full bg-white px-4 text-2xl font-black shadow-[0_4px_0_var(--c-teia-sombra)] ring-2 ring-[var(--c-teia)] touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-foco)]"
                  >
                    <span aria-hidden>🕸️</span>
                    {exibir(a.palavra, minusculas)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Coluna 2: paleta (sílabas da aula primeiro) */}
        <div className="flex flex-col gap-3">
          {daAula.length > 0 && (
            <div
              role="group"
              aria-label="Pecinhas desta missão"
              className="flex flex-wrap justify-center gap-2 rounded-[2rem] bg-[var(--c-sol)]/25 p-3 ring-2 ring-[var(--c-sol)] sm:gap-3"
            >
              {grupoPecas(daAula)}
            </div>
          )}
          {anteriores.length > 0 && (
            <div
              role="group"
              aria-label="Pecinhas das outras missões"
              className="flex flex-wrap justify-center gap-2 rounded-[2rem] bg-white/60 p-3 sm:gap-3"
            >
              {grupoPecas(anteriores)}
            </div>
          )}
        </div>

        <div className="flex min-h-[88px] shrink-0 justify-end md:landscape:col-span-2 lg:col-span-2">
          {podeContinuar && (
            <BotaoContinuar destaque={narrou || achadas.length > 0} onClick={aoConcluir} className="animate-crianca-entrar" />
          )}
        </div>
      </section>

      <DragOverlay dropAnimation={reduzido ? null : undefined}>
        {arrastando ? (
          <Peca texto={arrastando} minusculas={minusculas} tamanho="lg" aria-hidden tabIndex={-1} className="shadow-xl" />
        ) : null}
      </DragOverlay>

      {voo &&
        createPortal(
          <motion.div
            key={voo.id}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-40"
            initial={{ x: voo.de.x, y: voo.de.y, scale: 1, opacity: 1 }}
            animate={{ x: voo.para.x, y: voo.para.y, scale: 0.35, opacity: 0.5 }}
            transition={{ duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={() => setVoo(null)}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-3xl bg-[var(--c-teia)] px-5 py-2 text-5xl font-black text-white shadow-[0_6px_0_var(--c-teia-sombra)]">
              {exibir(voo.palavra, minusculas)}
            </div>
          </motion.div>,
          document.body,
        )}
    </DndContext>
  );
}
