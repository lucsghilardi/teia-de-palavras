"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Handshake, KeyRound, Plus, Unlink } from "lucide-react";

import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { mensagemDeErro } from "@/lib/api-errors";
import { formatDateTime } from "@/lib/format";
import { appToast } from "@/lib/toast";
import { aceitarAmizade, encerrarAmizade, gerarConviteAmizade, listAmizades, listTurmas } from "@/services/painel";
import type { Amizade, StatusAmizade } from "@/types/MiniAula";
import type { Turma } from "@/types/Turma";

function StatusBadge({ status }: { status: StatusAmizade }) {
  if (status === "aceita") return <Badge variant="success">Aceita</Badge>;
  if (status === "pendente") return <Badge variant="warning">Convite aberto</Badge>;
  if (status === "vencida") return <Badge variant="muted">Convite vencido</Badge>;

  return <Badge variant="muted">Encerrada</Badge>;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    appToast.success("Código copiado.");
  } catch {
    appToast.error("Não foi possível copiar. Anote o código.");
  }
}

export default function AmizadesPage() {
  const [amizades, setAmizades] = useState<Amizade[] | null>(null);
  const [termo, setTermo] = useState<{ versao: string; texto: string } | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [gerarAberto, setGerarAberto] = useState(false);
  const [turmaGerar, setTurmaGerar] = useState("");
  const [gerando, setGerando] = useState(false);
  const [convite, setConvite] = useState<Amizade | null>(null);

  const [aceitarAberto, setAceitarAberto] = useState(false);
  const [turmaAceitar, setTurmaAceitar] = useState("");
  const [codigo, setCodigo] = useState("");
  const [termoAceito, setTermoAceito] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [erroAceitar, setErroAceitar] = useState<string | null>(null);

  const [encerrar, setEncerrar] = useState<Amizade | null>(null);
  const [encerrando, setEncerrando] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([listAmizades(), listTurmas()])
      .then(([resposta, lista]) => {
        if (!ativo) return;

        setAmizades(resposta.amizades);
        setTermo(resposta.termo);
        setTurmas(lista.filter((t) => t.ativa));
      })
      .catch((error) => {
        if (!ativo) return;

        setAmizades([]);
        appToast.error(mensagemDeErro(error, "Não foi possível carregar as amizades."));
      });

    return () => {
      ativo = false;
    };
  }, []);

  const ativas = useMemo(() => (amizades ?? []).filter((a) => a.status === "aceita").length, [amizades]);

  function substituir(nova: Amizade) {
    setAmizades((atual) => (atual ? [nova, ...atual.filter((a) => a.id !== nova.id)] : [nova]));
  }

  async function gerar() {
    if (!turmaGerar) return;

    setGerando(true);

    try {
      const nova = await gerarConviteAmizade(Number(turmaGerar));
      substituir(nova);
      setConvite(nova);
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível gerar o convite."));
    } finally {
      setGerando(false);
    }
  }

  async function aceitar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroAceitar(null);

    if (!turmaAceitar || codigo.trim() === "") {
      setErroAceitar("Escolha a sua turma e digite o código recebido.");

      return;
    }

    if (!termoAceito) {
      setErroAceitar("Para ligar as turmas é preciso aceitar o termo.");

      return;
    }

    setAceitando(true);

    try {
      const nova = await aceitarAmizade({ turma_id: Number(turmaAceitar), codigo: codigo.trim(), termo_aceito: true });
      substituir(nova);
      setAceitarAberto(false);
      setCodigo("");
      setTermoAceito(false);
      appToast.success(`Turmas ligadas: ${nova.turma?.nome} e ${nova.turma_amiga?.nome}.`);
    } catch (error) {
      setErroAceitar(mensagemDeErro(error, "Não foi possível aceitar o convite."));
    } finally {
      setAceitando(false);
    }
  }

  async function confirmarEncerrar() {
    if (!encerrar) return;

    setEncerrando(true);

    try {
      substituir(await encerrarAmizade(encerrar.id));
      setEncerrar(null);
      appToast.success("Amizade encerrada. As mini-aulas trocadas deixaram de aparecer.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível encerrar."));
    } finally {
      setEncerrando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title="Amizades entre turmas"
        description="Ligue a sua turma à turma de um amigo ou primo (outra casa). Um responsável gera o código; o outro aceita com o termo. Depois disso as crianças das duas turmas trocam mini-aulas aprovadas por um adulto."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setAceitarAberto(true)}>
              <KeyRound />
              Aceitar um convite
            </Button>
            <Button type="button" onClick={() => setGerarAberto(true)}>
              <Plus />
              Gerar convite
            </Button>
          </div>
        }
      />

      <Alert>
        <Handshake />
        <AlertTitle>O que a turma amiga vê</AlertTitle>
        <AlertDescription>
          <p>
            Só o apelido e o avatar das crianças, e as mini-aulas (voz + desafio) que um adulto aprovou. Não há texto livre entre crianças.
            Qualquer responsável encerra a amizade quando quiser; as aulas trocadas somem na hora.
            {termo ? ` Termo em vigor: ${termo.versao}.` : ""}
          </p>
        </AlertDescription>
      </Alert>

      {amizades === null ? <PainelPageLoader label="Carregando amizades..." /> : null}

      {amizades && amizades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Handshake className="size-8" aria-hidden />
            Nenhuma amizade ainda. Gere um convite e mande o código ao outro responsável.
          </CardContent>
        </Card>
      ) : null}

      {amizades && amizades.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{ativas === 1 ? "1 amizade ativa." : `${ativas} amizades ativas.`}</p>
          {amizades.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {a.turma?.nome ?? "—"} <span className="text-muted-foreground">↔</span> {a.turma_amiga?.nome ?? "aguardando a outra turma"}
                    </CardTitle>
                    <CardDescription>
                      {a.status === "aceita" ? `Aceita em ${formatDateTime(a.aceita_em)} · termo ${a.termo_versao ?? "—"}` : null}
                      {a.status === "pendente" ? `Vale até ${formatDateTime(a.expira_em)}` : null}
                      {a.status === "vencida" ? `Venceu em ${formatDateTime(a.expira_em)}` : null}
                      {a.status === "encerrada" ? `Encerrada em ${formatDateTime(a.encerrada_em)}` : null}
                    </CardDescription>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </CardHeader>
              {a.codigo ? (
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-muted px-3 py-1.5 font-mono text-lg tracking-[0.3em]">{a.codigo}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => void copiar(a.codigo ?? "")}>
                      <Copy />
                      Copiar código
                    </Button>
                    <span className="text-xs text-muted-foreground">Mande ao outro responsável; uso único.</span>
                  </div>
                </CardContent>
              ) : null}
              {a.status === "aceita" || a.status === "pendente" ? (
                <CardFooter className="justify-end">
                  <Button type="button" variant="outline" onClick={() => setEncerrar(a)}>
                    <Unlink />
                    {a.status === "aceita" ? "Encerrar amizade" : "Cancelar convite"}
                  </Button>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {/* Gerar convite */}
      <Dialog
        open={gerarAberto}
        onOpenChange={(aberto) => {
          if (gerando) return;
          setGerarAberto(aberto);
          if (!aberto) setConvite(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar convite de amizade</DialogTitle>
            <DialogDescription>O código vale 7 dias e só pode ser usado uma vez, pelo responsável da outra turma.</DialogDescription>
          </DialogHeader>
          {convite ? (
            <div className="space-y-3">
              <p className="text-sm">Convite da turma {convite.turma?.nome}:</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-muted px-4 py-2 font-mono text-2xl tracking-[0.3em]">{convite.codigo}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => void copiar(convite.codigo ?? "")}>
                  <Copy />
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Vale até {formatDateTime(convite.expira_em)}.</p>
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor="gerar-turma">Minha turma</FieldLabel>
              <Select value={turmaGerar} onValueChange={setTurmaGerar} disabled={gerando}>
                <SelectTrigger id="gerar-turma" className="w-full">
                  <SelectValue placeholder="Escolha a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>A turma que vai ficar amiga da turma de quem receber o código.</FieldDescription>
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={gerando} onClick={() => setGerarAberto(false)}>
              {convite ? "Fechar" : "Cancelar"}
            </Button>
            {!convite ? (
              <Button type="button" disabled={gerando || !turmaGerar} onClick={() => void gerar()}>
                {gerando ? <Spinner data-icon="inline-start" /> : <Plus />}
                Gerar código
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aceitar convite */}
      <Dialog
        open={aceitarAberto}
        onOpenChange={(aberto) => {
          if (!aceitando) setAceitarAberto(aberto);
        }}
      >
        <DialogContent>
          <form onSubmit={aceitar} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Aceitar um convite</DialogTitle>
              <DialogDescription>Digite o código que o outro responsável mandou e aceite o termo.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="aceitar-turma">Minha turma</FieldLabel>
                <Select value={turmaAceitar} onValueChange={setTurmaAceitar} disabled={aceitando}>
                  <SelectTrigger id="aceitar-turma" className="w-full">
                    <SelectValue placeholder="Escolha a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="aceitar-codigo">Código do convite</FieldLabel>
                <Input
                  id="aceitar-codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  maxLength={8}
                  autoComplete="off"
                  className="w-48 font-mono tracking-[0.3em] uppercase"
                  disabled={aceitando}
                />
              </Field>
              <Field>
                <FieldLabel>Termo de amizade entre turmas {termo ? `(${termo.versao})` : ""}</FieldLabel>
                <div className="max-h-40 overflow-auto rounded-md border bg-muted/40 px-3 py-2 text-sm leading-6">{termo?.texto}</div>
                <label className="flex items-start gap-2 text-sm leading-6">
                  <Checkbox checked={termoAceito} onCheckedChange={(v) => setTermoAceito(v === true)} disabled={aceitando} className="mt-1" />
                  <span>Li e aceito o termo em nome da minha turma.</span>
                </label>
              </Field>
              <FieldError>{erroAceitar}</FieldError>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={aceitando} onClick={() => setAceitarAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={aceitando}>
                {aceitando ? <Spinner data-icon="inline-start" /> : <Handshake />}
                Ligar as turmas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={encerrar !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setEncerrar(null);
        }}
        title={encerrar?.status === "aceita" ? "Encerrar a amizade?" : "Cancelar o convite?"}
        description={
          encerrar?.status === "aceita" ? (
            <p>
              As crianças de {encerrar.turma?.nome} e {encerrar.turma_amiga?.nome} deixam de ver as mini-aulas umas das outras. As aulas já trocadas somem na hora.
            </p>
          ) : (
            <p>O código deixa de valer.</p>
          )
        }
        confirmLabel={encerrar?.status === "aceita" ? "Encerrar" : "Cancelar convite"}
        destructive
        loading={encerrando}
        onConfirm={() => void confirmarEncerrar()}
      />
    </div>
  );
}
