"use client";

import { useEffect, useState } from "react";
import { Check, Mic, X } from "lucide-react";

import { OpcaoVisualIcone } from "@/components/painel/opcao-visual";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { mensagemDeErro } from "@/lib/api-errors";
import { formatDateTime } from "@/lib/format";
import { appToast } from "@/lib/toast";
import { aprovarMiniAula, listMiniAulas, recusarMiniAula, urlAudioMiniAula } from "@/services/painel";
import type { MiniAulaPainel, StatusMiniAula } from "@/types/MiniAula";

const ABAS: { value: StatusMiniAula; label: string }[] = [
  { value: "pendente", label: "Para ouvir" },
  { value: "aprovada", label: "Aprovadas" },
  { value: "recusada", label: "Recusadas" },
];

const DISCIPLINAS: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  geografia: "Geografia",
  historia: "História",
};

function duracao(ms: number | null) {
  if (!ms) return null;

  const s = Math.round(ms / 1000);

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Item = { id?: string; [chave: string]: unknown };

/** Prévia do desafio para o adulto (aqui a resposta certa aparece; para a criança nunca). */
function PreviaDesafio({ tipo, config }: { tipo: string; config: Record<string, unknown> }) {
  const itens = Array.isArray(config.itens) ? (config.itens as Item[]) : [];
  const item = itens[0];
  const lista = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

  let texto: string | null = null;

  if (tipo === "escolher_silaba" && item) {
    const silabas = lista(item.silabas);
    const posicao = Number(item.posicao ?? item.oculta ?? 0);
    texto = `${silabas.map((s, i) => (i === posicao ? "__" : s)).join("-")} → ${silabas[posicao] ?? "?"} · opções: ${lista(item.opcoes).join(", ")}`;
  } else if (tipo === "ditado" && item) {
    texto = `${String(item.palavra)} (${lista(item.silabas).join("-")}) · peças: ${lista(item.opcoes).join(", ")}`;
  } else if (tipo === "somar_subtrair" && item) {
    const a = Number(item.a);
    const b = Number(item.b);
    texto = `${a} ${String(item.operacao)} ${b} = ${item.operacao === "-" ? a - b : a + b}`;
  } else if (tipo === "contar" && item) {
    texto = `quantidade: ${String(item.quantidade)}`;
  } else if ((tipo === "escolha" || tipo === "verdadeiro_falso") && item) {
    const opcoes = lista(item.opcoes);
    const correta = Number(item.correta ?? 0);
    texto = `${String(item.pergunta ?? item.frase ?? "")} · ${opcoes.map((o, i) => (i === correta ? `[${o}]` : o)).join(" / ")}`;
  } else if ((tipo === "ordenar" || tipo === "linha_do_tempo") && itens.length > 0) {
    texto = itens.map((i) => String(i.texto ?? "")).join(" → ");
  } else if (tipo === "parear" && Array.isArray(config.pares)) {
    texto = (config.pares as Item[]).map((p) => `${String(p.a)} ↔ ${String(p.b)}`).join(" · ");
  }

  return texto ? (
    <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs leading-5 wrap-anywhere">{texto}</p>
  ) : (
    <pre className="max-h-40 overflow-auto rounded-md bg-muted px-3 py-2 text-xs leading-5">{JSON.stringify(config, null, 2)}</pre>
  );
}

function StatusBadge({ status }: { status: StatusMiniAula }) {
  if (status === "aprovada") return <Badge variant="success">Aprovada</Badge>;
  if (status === "recusada") return <Badge variant="muted">Recusada</Badge>;

  return <Badge variant="warning">Para ouvir</Badge>;
}

export default function MiniAulasPage() {
  const [status, setStatus] = useState<StatusMiniAula>("pendente");
  const [lista, setLista] = useState<MiniAulaPainel[] | null>(null);
  const [agindo, setAgindo] = useState<number | null>(null);
  const [recusa, setRecusa] = useState<MiniAulaPainel | null>(null);
  const [motivo, setMotivo] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let ativo = true;

    listMiniAulas(status)
      .then((dados) => {
        if (ativo) setLista(dados);
      })
      .catch((error) => {
        if (!ativo) return;

        setLista([]);
        appToast.error(mensagemDeErro(error, "Não foi possível carregar as mini-aulas."));
      });

    return () => {
      ativo = false;
    };
  }, [status, recarga]);

  function remover(id: number) {
    setLista((atual) => (atual ? atual.filter((m) => m.id !== id) : atual));
  }

  async function aprovar(mini: MiniAulaPainel) {
    setAgindo(mini.id);

    try {
      const aprovada = await aprovarMiniAula(mini.id);
      remover(mini.id);
      appToast.success(
        aprovada.entregas === 1
          ? `Aprovada: chegou a 1 criança.`
          : `Aprovada: chegou a ${aprovada.entregas} crianças (turma e turmas amigas).`,
      );
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível aprovar."));
    } finally {
      setAgindo(null);
    }
  }

  async function recusar() {
    if (!recusa) return;

    setAgindo(recusa.id);

    try {
      await recusarMiniAula(recusa.id, motivo.trim() || null);
      remover(recusa.id);
      setRecusa(null);
      setMotivo("");
      appToast.success("Recusada. O áudio foi apagado.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível recusar."));
    } finally {
      setAgindo(null);
    }
  }

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title="Mini-aulas"
        description="Aulas gravadas pelas crianças (voz + um desafio pronto). Ouça e aprove: só então a aula chega às crianças da turma e das turmas amigas. Recusar apaga o áudio."
        actions={
          <Tabs
            aria-label="Situação"
            idBase="mini-aulas"
            value={status}
            onValueChange={(valor) => {
              setLista(null);
              setStatus(valor as StatusMiniAula);
            }}
            items={ABAS}
          />
        }
      />

      <TabPanel idBase="mini-aulas" value={status} className="space-y-4">
        {lista === null ? <PainelPageLoader label="Carregando mini-aulas..." /> : null}

        {lista && lista.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Mic className="size-8" aria-hidden />
              {status === "pendente" ? "Nenhuma mini-aula esperando você." : "Nada por aqui."}
            </CardContent>
          </Card>
        ) : null}

        {lista?.map((mini) => {
          const audio = urlAudioMiniAula(mini);
          const tempo = duracao(mini.duracao_ms);

          return (
            <Card key={mini.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <OpcaoVisualIcone opcao={mini.autor?.avatar} decorative sizeClassName="size-10 text-2xl" />
                    <div className="min-w-0">
                      <CardTitle className="truncate">{mini.titulo}</CardTitle>
                      <CardDescription>
                        {mini.autor ? `${mini.autor.apelido} · ${mini.autor.turma?.nome ?? "sem turma"}` : "criança excluída"} ·{" "}
                        {formatDateTime(mini.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={mini.status} />
                    <Badge variant="info">{DISCIPLINAS[mini.disciplina] ?? mini.disciplina}</Badge>
                    <Badge variant="outline">{mini.tipo.replace(/_/g, " ")}</Badge>
                    {mini.aula_origem ? <Badge variant="muted">Missão {mini.aula_origem.rotulo}</Badge> : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {audio ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <audio controls preload="none" src={audio} className="h-10 w-full max-w-md" aria-label={`Áudio de ${mini.autor?.apelido ?? "criança"}`} />
                    {tempo ? <span className="text-xs text-muted-foreground">{tempo}</span> : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Áudio apagado.</p>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Desafio (com a resposta, só para você)</p>
                  <PreviaDesafio tipo={mini.tipo} config={mini.config} />
                </div>

                {mini.status === "aprovada" ? (
                  <p className="text-sm text-muted-foreground">
                    Entregue a {mini.entregas === 1 ? "1 criança" : `${mini.entregas} crianças`}; {mini.respondidas === 1 ? "1 respondeu" : `${mini.respondidas} responderam`}.
                    {mini.revisada_por ? ` Aprovada por ${mini.revisada_por} em ${formatDateTime(mini.revisada_em)}.` : ""}
                  </p>
                ) : null}

                {mini.status === "recusada" ? (
                  <p className="text-sm text-muted-foreground">
                    Recusada{mini.revisada_por ? ` por ${mini.revisada_por}` : ""} em {formatDateTime(mini.revisada_em)}
                    {mini.motivo_recusa ? `: ${mini.motivo_recusa}` : "."}
                  </p>
                ) : null}
              </CardContent>

              {mini.status === "pendente" ? (
                <CardFooter className="justify-end gap-2">
                  <Button type="button" variant="outline" disabled={agindo === mini.id} onClick={() => setRecusa(mini)}>
                    <X />
                    Recusar
                  </Button>
                  <Button type="button" disabled={agindo === mini.id} onClick={() => void aprovar(mini)}>
                    {agindo === mini.id ? <Spinner data-icon="inline-start" /> : <Check />}
                    Aprovar e enviar aos amigos
                  </Button>
                </CardFooter>
              ) : null}
            </Card>
          );
        })}
      </TabPanel>

      <Dialog
        open={recusa !== null}
        onOpenChange={(aberto) => {
          if (!aberto && agindo === null) setRecusa(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar a mini-aula</DialogTitle>
            <DialogDescription>
              O áudio é apagado do servidor e a aula não chega a nenhuma criança. A criança vê só &quot;não foi dessa vez&quot;.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="motivo-recusa">Motivo (só para os adultos)</FieldLabel>
            <Textarea id="motivo-recusa" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={200} />
            <FieldDescription>Opcional. Ajuda outro adulto a entender a decisão.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={agindo !== null} onClick={() => setRecusa(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={agindo !== null} onClick={() => void recusar()}>
              {agindo !== null ? <Spinner data-icon="inline-start" /> : <X />}
              Recusar e apagar o áudio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Recarregar a lista:{" "}
        <button type="button" className="underline underline-offset-4" onClick={() => setRecarga((n) => n + 1)}>
          atualizar
        </button>
        . Áudios recusados são apagados na hora; os removidos, pela limpeza diária.
      </p>
    </div>
  );
}
