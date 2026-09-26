"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpenText,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { CaixaAltaInput } from "@/components/painel/caixa-alta-input";
import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { RemoteImage } from "@/components/painel/remote-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { mensagemDeErro } from "@/lib/api-errors";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  createAula,
  deleteAula,
  despublicarAula,
  listAulas,
  publicarAula,
  reordenarAulas,
} from "@/services/painel";
import type { Aula, AulaResumo } from "@/types/Aula";

const FASES_PADRAO = [1, 2];

const DESCRICAO_FASE: Record<number, string> = {
  1: "Letras maiúsculas, palavras geradoras e famílias silábicas.",
  2: "Aprofundamento: novas palavras a partir das famílias já conhecidas.",
};

function ordenarAulas(aulas: AulaResumo[]) {
  return [...aulas].sort((a, b) => a.fase - b.fase || a.ordem - b.ordem);
}

/** Atualiza o resumo da lista com o que voltou de publicar/despublicar. */
function resumoAtualizado(resumo: AulaResumo, aula: Aula): AulaResumo {
  return {
    ...resumo,
    titulo: aula.titulo,
    status: aula.status,
    fase: aula.fase,
    ordem: aula.ordem,
    palavra_geradora: aula.palavra_geradora,
    palavra_imagem_url: aula.palavra_imagem_url,
    pre_requisito_aula_id: aula.pre_requisito_aula_id,
    updated_at: aula.updated_at,
  };
}

const instrucoesLeitor: ScreenReaderInstructions = {
  draggable:
    "Para mover uma aula, pressione espaço ou enter. Use as setas para cima e para baixo para escolher a nova posição, espaço ou enter para soltar e Esc para cancelar.",
};

function anunciosLeitor(aulas: AulaResumo[]): Announcements {
  const nome = (id: string | number) =>
    aulas.find((aula) => aula.id === Number(id))?.palavra_geradora ?? "aula";
  const posicao = (id: string | number) => {
    const aula = aulas.find((item) => item.id === Number(id));
    if (!aula) return 0;
    return aulas.filter((item) => item.fase === aula.fase).findIndex((item) => item.id === aula.id) + 1;
  };

  return {
    onDragStart: ({ active }) => `Aula ${nome(active.id)} selecionada.`,
    onDragOver: ({ active, over }) =>
      over ? `Aula ${nome(active.id)} sobre a posição ${posicao(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Aula ${nome(active.id)} solta na posição ${posicao(over.id)}.`
        : `Aula ${nome(active.id)} solta.`,
    onDragCancel: ({ active }) => `Movimento da aula ${nome(active.id)} cancelado.`,
  };
}

type AulaLinhaProps = {
  aula: AulaResumo;
  posicao: number;
  preRequisito: AulaResumo | null;
  ocupada: boolean;
  arrastoDesabilitado: boolean;
  onPublicar: (aula: AulaResumo) => void;
  onDespublicar: (aula: AulaResumo) => void;
  onExcluir: (aula: AulaResumo) => void;
};

function AulaLinha({
  aula,
  posicao,
  preRequisito,
  ocupada,
  arrastoDesabilitado,
  onPublicar,
  onDespublicar,
  onExcluir,
}: AulaLinhaProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: aula.id, disabled: arrastoDesabilitado });

  const publicada = aula.status === "publicada";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-xs sm:flex-nowrap sm:gap-4",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Mover aula ${aula.palavra_geradora} (posição ${posicao})`}
        disabled={arrastoDesabilitado}
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        <GripVertical className="size-5" />
      </button>

      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary tabular-nums"
        aria-label={`Ordem ${posicao}`}
      >
        {posicao}
      </span>

      {aula.palavra_imagem_url ? (
        <RemoteImage
          src={aula.palavra_imagem_url}
          alt=""
          aria-hidden="true"
          className="hidden size-12 shrink-0 rounded-lg border object-cover md:block"
        />
      ) : null}

      <div className="min-w-0 flex-1 basis-48">
        <p className="text-2xl leading-tight font-extrabold tracking-wide break-words uppercase">
          {aula.palavra_geradora}
        </p>
        <p className="text-sm break-words text-muted-foreground">{aula.titulo}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{aula.totais.silabas} sílabas</span>
          <span>{aula.totais.paginas} páginas</span>
          <span>{aula.totais.perguntas} perguntas</span>
          <span>{aula.totais.palavras} palavras</span>
        </p>
      </div>

      <div className="flex min-w-0 flex-col items-start gap-1.5 sm:w-44">
        <Badge variant={publicada ? "success" : "muted"}>
          {publicada ? "Publicada" : "Rascunho"}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="size-3 shrink-0" aria-hidden="true" />
          {preRequisito ? (
            <span className="truncate">
              Depois de <strong className="uppercase">{preRequisito.palavra_geradora}</strong>
            </span>
          ) : (
            "Sem pré-requisito"
          )}
        </span>
      </div>

      <div className="flex w-full flex-wrap justify-end gap-1.5 sm:w-auto sm:flex-nowrap">
        <Button asChild size="sm" variant="outline">
          <Link href={`/painel/aulas/${aula.id}`}>
            <Pencil />
            Editar
          </Link>
        </Button>
        {publicada ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ocupada}
            onClick={() => onDespublicar(aula)}
          >
            {ocupada ? <Spinner /> : <EyeOff />}
            Despublicar
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={ocupada}
            onClick={() => onPublicar(aula)}
          >
            {ocupada ? <Spinner /> : <Eye />}
            Publicar
          </Button>
        )}
        {publicada ? null : (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={ocupada}
            onClick={() => onExcluir(aula)}
            aria-label={`Excluir aula ${aula.palavra_geradora}`}
            title="Excluir rascunho"
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </li>
  );
}

export default function AulasPage() {
  const router = useRouter();
  const [aulas, setAulas] = useState<AulaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordenando, setReordenando] = useState(false);
  const [aulaOcupada, setAulaOcupada] = useState<number | null>(null);

  const [novaAberta, setNovaAberta] = useState(false);
  const [formNova, setFormNova] = useState({ titulo: "", palavra_geradora: "", fase: "1" });
  const [criando, setCriando] = useState(false);
  const [erroNova, setErroNova] = useState<string | null>(null);

  const [aulaExclusao, setAulaExclusao] = useState<AulaResumo | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let ativo = true;

    listAulas()
      .then((data) => {
        if (ativo) setAulas(ordenarAulas(data));
      })
      .catch((error) => {
        appToast.error(mensagemDeErro(error, "Não foi possível carregar as aulas."));
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const fases = useMemo(
    () =>
      Array.from(new Set([...FASES_PADRAO, ...aulas.map((aula) => aula.fase)])).sort(
        (a, b) => a - b,
      ),
    [aulas],
  );

  const porId = useMemo(() => new Map(aulas.map((aula) => [aula.id, aula])), [aulas]);
  const anuncios = useMemo(() => anunciosLeitor(aulas), [aulas]);

  const resumo = useMemo(
    () => ({
      total: aulas.length,
      publicadas: aulas.filter((aula) => aula.status === "publicada").length,
    }),
    [aulas],
  );

  async function handleDragEnd(fase: number, event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const daFase = aulas.filter((aula) => aula.fase === fase);
    const de = daFase.findIndex((aula) => aula.id === Number(active.id));
    const para = daFase.findIndex((aula) => aula.id === Number(over.id));

    if (de < 0 || para < 0) {
      return;
    }

    const anterior = aulas;
    const novaOrdem = arrayMove(daFase, de, para).map((aula, index) => ({
      ...aula,
      ordem: index + 1,
    }));

    // Otimista: a lista já aparece na nova ordem enquanto o backend confirma.
    setAulas(ordenarAulas([...aulas.filter((aula) => aula.fase !== fase), ...novaOrdem]));
    setReordenando(true);

    try {
      const confirmadas = await reordenarAulas(novaOrdem.map((aula) => aula.id));
      const mapa = new Map(confirmadas.map((aula) => [aula.id, aula]));

      setAulas((atuais) => ordenarAulas(atuais.map((aula) => mapa.get(aula.id) ?? aula)));
      appToast.success("Ordem das aulas atualizada.");
    } catch (error) {
      setAulas(anterior);
      appToast.error(mensagemDeErro(error, "Não foi possível reordenar as aulas."));
    } finally {
      setReordenando(false);
    }
  }

  async function alternarPublicacao(aula: AulaResumo, publicar: boolean) {
    setAulaOcupada(aula.id);

    try {
      const atualizada = publicar
        ? await publicarAula(aula.id)
        : await despublicarAula(aula.id);

      setAulas((atuais) =>
        ordenarAulas(
          atuais.map((item) => (item.id === aula.id ? resumoAtualizado(item, atualizada) : item)),
        ),
      );
      appToast.success(publicar ? "Aula publicada." : "Aula voltou para rascunho.");
    } catch (error) {
      appToast.error(
        mensagemDeErro(
          error,
          publicar ? "Não foi possível publicar a aula." : "Não foi possível despublicar a aula.",
        ),
      );
    } finally {
      setAulaOcupada(null);
    }
  }

  async function handleCriar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCriando(true);
    setErroNova(null);

    try {
      const criada = await createAula({
        titulo: formNova.titulo.trim(),
        palavra_geradora: formNova.palavra_geradora.trim(),
        fase: Number(formNova.fase),
      });

      appToast.success("Aula criada. Agora complete o conteúdo.");
      router.push(`/painel/aulas/${criada.id}`);
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível criar a aula.");

      setErroNova(mensagem);
      appToast.error(mensagem);
      setCriando(false);
    }
  }

  async function handleExcluir() {
    if (!aulaExclusao) {
      return;
    }

    setExcluindo(true);

    try {
      await deleteAula(aulaExclusao.id);
      setAulas((atuais) => atuais.filter((aula) => aula.id !== aulaExclusao.id));
      setAulaExclusao(null);
      appToast.success("Rascunho excluído.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível excluir a aula."));
    } finally {
      setExcluindo(false);
    }
  }

  if (loading) {
    return <PainelPageLoader label="Carregando aulas..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <PainelPageHeader
          title="Aulas"
          description="Cada aula parte de uma palavra geradora. Arraste para mudar a ordem dentro da fase; só aulas publicadas aparecem para as crianças."
          actions={
            <Button
              type="button"
              onClick={() => {
                setFormNova({ titulo: "", palavra_geradora: "", fase: "1" });
                setErroNova(null);
                setNovaAberta(true);
              }}
            >
              <Plus className="size-4" />
              Nova aula
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-violet-100 bg-violet-50/60">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aulas cadastradas</p>
                <p className="text-3xl font-extrabold tabular-nums">{resumo.total}</p>
              </div>
              <BookOpenText className="size-5 text-violet-700" aria-hidden="true" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Publicadas</p>
              <p className="text-3xl font-extrabold tabular-nums">{resumo.publicadas}</p>
            </CardContent>
          </Card>
        </div>

        {fases.map((fase) => {
          const daFase = aulas.filter((aula) => aula.fase === fase);

          return (
            <Card key={fase}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Fase {fase}
                  <Badge variant="outline">
                    {daFase.length === 1 ? "1 aula" : `${daFase.length} aulas`}
                  </Badge>
                  {reordenando ? <Spinner className="text-muted-foreground" /> : null}
                </CardTitle>
                {DESCRICAO_FASE[fase] ? (
                  <CardDescription>{DESCRICAO_FASE[fase]}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {daFase.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma aula na Fase {fase}.
                  </p>
                ) : (
                  <DndContext
                    id={`aulas-fase-${fase}`}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => void handleDragEnd(fase, event)}
                    accessibility={{
                      announcements: anuncios,
                      screenReaderInstructions: instrucoesLeitor,
                    }}
                  >
                    <SortableContext
                      items={daFase.map((aula) => aula.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="space-y-2" aria-label={`Aulas da Fase ${fase}`}>
                        {daFase.map((aula, index) => (
                          <AulaLinha
                            key={aula.id}
                            aula={aula}
                            posicao={index + 1}
                            preRequisito={
                              aula.pre_requisito_aula_id
                                ? (porId.get(aula.pre_requisito_aula_id) ?? null)
                                : null
                            }
                            ocupada={aulaOcupada === aula.id}
                            arrastoDesabilitado={reordenando || daFase.length < 2}
                            onPublicar={(item) => void alternarPublicacao(item, true)}
                            onDespublicar={(item) => void alternarPublicacao(item, false)}
                            onExcluir={setAulaExclusao}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={novaAberta}
        onOpenChange={(open) => {
          if (!criando) setNovaAberta(open);
        }}
      >
        <DialogContent>
          <form onSubmit={handleCriar} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Nova aula</DialogTitle>
              <DialogDescription>
                A aula nasce como rascunho. As sílabas e famílias são sugeridas a
                partir da palavra geradora e podem ser ajustadas no editor.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="nova-aula-palavra">Palavra geradora</FieldLabel>
                <CaixaAltaInput
                  id="nova-aula-palavra"
                  value={formNova.palavra_geradora}
                  onValueChange={(valor) =>
                    setFormNova((atual) => ({
                      ...atual,
                      palavra_geradora: valor,
                    }))
                  }
                  placeholder="Ex.: TATU"
                  autoComplete="off"
                  className="h-12 text-2xl font-extrabold tracking-wide md:text-2xl"
                  disabled={criando}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="nova-aula-titulo">Título</FieldLabel>
                <Input
                  id="nova-aula-titulo"
                  value={formNova.titulo}
                  onChange={(event) =>
                    setFormNova((atual) => ({ ...atual, titulo: event.target.value }))
                  }
                  placeholder="Ex.: O tatu e a toca"
                  disabled={criando}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="nova-aula-fase">Fase</FieldLabel>
                <Select
                  value={formNova.fase}
                  onValueChange={(valor) => setFormNova((atual) => ({ ...atual, fase: valor }))}
                  disabled={criando}
                >
                  <SelectTrigger id="nova-aula-fase" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FASES_PADRAO.map((fase) => (
                      <SelectItem key={fase} value={String(fase)}>
                        Fase {fase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>A aula entra no fim da fase escolhida.</FieldDescription>
              </Field>

              <FieldError>{erroNova}</FieldError>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNovaAberta(false)}
                disabled={criando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={criando || !formNova.titulo.trim() || !formNova.palavra_geradora.trim()}
              >
                {criando ? <Spinner data-icon="inline-start" /> : <Plus />}
                Criar e editar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={aulaExclusao !== null}
        onOpenChange={(open) => {
          if (!open) setAulaExclusao(null);
        }}
        title="Excluir rascunho?"
        description={
          <p>
            A aula <strong className="uppercase">{aulaExclusao?.palavra_geradora}</strong> (
            {aulaExclusao?.titulo}) e todo o seu conteúdo serão excluídos. Só é possível
            excluir rascunhos que nenhuma criança começou.
          </p>
        }
        confirmLabel="Excluir aula"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </>
  );
}
