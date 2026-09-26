"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  School,
  Trash2,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useOrigin } from "@/hooks/use-origin";
import { mensagemDeErro } from "@/lib/api-errors";
import { formatLocalDate } from "@/lib/format";
import { appToast } from "@/lib/toast";
import {
  createTurma,
  deleteTurma,
  gerarNovoCodigoTurma,
  listTurmas,
  updateTurma,
} from "@/services/painel";
import type { Turma, UpdateTurmaPayload } from "@/types/Turma";

function ordenarTurmas(turmas: Turma[]) {
  return [...turmas].sort((a, b) => {
    const ativaDiff = Number(b.ativa) - Number(a.ativa);

    if (ativaDiff !== 0) {
      return ativaDiff;
    }

    return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
  });
}

/** Link que o dispositivo da criança abre para entrar na turma. */
function linkDePareamento(origin: string, codigo: string) {
  return `${origin}/app/entrar?codigo=${encodeURIComponent(codigo)}`;
}

function textoCriancas(total: number) {
  return total === 1 ? "1 criança" : `${total} crianças`;
}

export default function TurmasPage() {
  const { user } = useAuth();
  const origin = useOrigin();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  const [nomeNova, setNomeNova] = useState("");
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  const [turmaEdicao, setTurmaEdicao] = useState<Turma | null>(null);
  const [formEdicao, setFormEdicao] = useState<UpdateTurmaPayload>({
    nome: "",
    ativa: true,
  });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [turmaQr, setTurmaQr] = useState<Turma | null>(null);
  const [turmaNovoCodigo, setTurmaNovoCodigo] = useState<Turma | null>(null);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [turmaExclusao, setTurmaExclusao] = useState<Turma | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let ativo = true;

    listTurmas()
      .then((data) => {
        if (ativo) {
          setTurmas(ordenarTurmas(data));
        }
      })
      .catch((error) => {
        appToast.error(
          mensagemDeErro(error, "Não foi possível carregar as turmas."),
        );
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const resumo = useMemo(
    () => ({
      total: turmas.length,
      ativas: turmas.filter((turma) => turma.ativa).length,
      criancas: turmas.reduce((soma, turma) => soma + turma.total_criancas, 0),
    }),
    [turmas],
  );

  function substituirTurma(atualizada: Turma) {
    setTurmas((atuais) =>
      ordenarTurmas(
        atuais.map((turma) => (turma.id === atualizada.id ? atualizada : turma)),
      ),
    );
  }

  async function handleCriar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCriando(true);
    setErroCriacao(null);

    try {
      const criada = await createTurma({ nome: nomeNova.trim() });

      setTurmas((atuais) => ordenarTurmas([criada, ...atuais]));
      setNomeNova("");
      appToast.success(`Turma criada. Código: ${criada.codigo}`);
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível criar a turma.");

      setErroCriacao(mensagem);
      appToast.error(mensagem);
    } finally {
      setCriando(false);
    }
  }

  function abrirEdicao(turma: Turma) {
    setTurmaEdicao(turma);
    setFormEdicao({ nome: turma.nome, ativa: turma.ativa });
    setErroEdicao(null);
  }

  async function handleEditar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!turmaEdicao) {
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao(null);

    try {
      const atualizada = await updateTurma(turmaEdicao.id, {
        nome: formEdicao.nome.trim(),
        ativa: formEdicao.ativa,
      });

      substituirTurma(atualizada);
      setTurmaEdicao(null);
      appToast.success("Turma atualizada.");
    } catch (error) {
      const mensagem = mensagemDeErro(
        error,
        "Não foi possível atualizar a turma.",
      );

      setErroEdicao(mensagem);
      appToast.error(mensagem);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleNovoCodigo() {
    if (!turmaNovoCodigo) {
      return;
    }

    setGerandoCodigo(true);

    try {
      const atualizada = await gerarNovoCodigoTurma(turmaNovoCodigo.id);

      substituirTurma(atualizada);
      setTurmaNovoCodigo(null);
      appToast.success(`Novo código: ${atualizada.codigo}`);
    } catch (error) {
      appToast.error(
        mensagemDeErro(error, "Não foi possível gerar um novo código."),
      );
    } finally {
      setGerandoCodigo(false);
    }
  }

  async function handleExcluir() {
    if (!turmaExclusao) {
      return;
    }

    setExcluindo(true);

    try {
      await deleteTurma(turmaExclusao.id);

      setTurmas((atuais) =>
        atuais.filter((turma) => turma.id !== turmaExclusao.id),
      );
      setTurmaExclusao(null);
      appToast.success("Turma excluída.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível excluir a turma."));
    } finally {
      setExcluindo(false);
    }
  }

  async function copiarLink(turma: Turma) {
    try {
      await navigator.clipboard.writeText(
        linkDePareamento(origin, turma.codigo),
      );
      appToast.success("Link copiado.");
    } catch {
      appToast.error("Não foi possível copiar o link.");
    }
  }

  if (loading) {
    return <PainelPageLoader label="Carregando turmas..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <PainelPageHeader
          title="Turmas"
          description="Cada turma tem um código de 6 letras. O dispositivo da criança entra na turma lendo o QR code ou digitando o código."
          actions={
            user?.role === "educador" ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">
                <School className="size-4" />
                Você vê apenas as turmas que criou
              </div>
            ) : null
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-sky-100 bg-sky-50/60">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas</p>
                <p className="text-3xl font-extrabold tabular-nums">
                  {resumo.total}
                </p>
              </div>
              <School className="size-5 text-sky-700" aria-hidden="true" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-3xl font-extrabold tabular-nums">
                {resumo.ativas}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Crianças nas turmas</p>
              <p className="text-3xl font-extrabold tabular-nums">
                {resumo.criancas}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Nova turma</CardTitle>
              <CardDescription>
                O código de acesso é gerado automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCriar}>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="turma-nome">Nome da turma</FieldLabel>
                    <Input
                      id="turma-nome"
                      value={nomeNova}
                      onChange={(event) => setNomeNova(event.target.value)}
                      placeholder="Ex.: Turma da manhã"
                      maxLength={120}
                      disabled={criando}
                      aria-invalid={erroCriacao ? true : undefined}
                      required
                    />
                  </Field>

                  <FieldError>{erroCriacao}</FieldError>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={criando || !nomeNova.trim()}
                  >
                    {criando ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Criando turma...
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        Criar turma
                      </>
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {turmas.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
              <School className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold">Nenhuma turma ainda</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Crie a primeira turma ao lado para gerar o código de acesso das
                crianças.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2" aria-label="Turmas">
              {turmas.map((turma) => (
                <li key={turma.id}>
                  <Card className="h-full gap-4">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg leading-snug break-words">
                          {turma.nome}
                        </CardTitle>
                        <Badge variant={turma.ativa ? "success" : "muted"}>
                          {turma.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Educador: {turma.educador.name} · desde{" "}
                        {formatLocalDate(turma.created_at)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Código da turma
                        </p>
                        <p
                          className="font-mono text-3xl font-extrabold tracking-[0.25em] text-primary"
                          aria-label={`Código ${turma.codigo.split("").join(" ")}`}
                        >
                          {turma.codigo}
                        </p>
                        <Link
                          href={`/painel/criancas?turma_id=${turma.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <Users className="size-4" aria-hidden="true" />
                          {textoCriancas(turma.total_criancas)}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTurmaQr(turma)}
                        className="shrink-0 rounded-lg border bg-white p-1.5 transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        aria-label={`Ampliar QR code da turma ${turma.nome}`}
                      >
                        {origin ? (
                          <QRCodeSVG
                            value={linkDePareamento(origin, turma.codigo)}
                            size={80}
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="block size-20" />
                        )}
                      </button>
                    </CardContent>

                    <CardFooter className="mt-auto flex flex-wrap gap-2 border-t pt-4 [.border-t]:pt-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTurmaQr(turma)}
                      >
                        <QrCode />
                        Parear dispositivo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => abrirEdicao(turma)}
                      >
                        <Pencil />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTurmaNovoCodigo(turma)}
                      >
                        <RefreshCw />
                        Novo código
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setTurmaExclusao(turma)}
                        disabled={turma.total_criancas > 0}
                        title={
                          turma.total_criancas > 0
                            ? "Só é possível excluir turmas sem crianças"
                            : undefined
                        }
                      >
                        <Trash2 />
                        Excluir
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={turmaQr !== null}
        onOpenChange={(open) => {
          if (!open) setTurmaQr(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {turmaQr ? (
            <>
              <DialogHeader>
                <DialogTitle>Parear dispositivo · {turmaQr.nome}</DialogTitle>
                <DialogDescription>
                  No tablet ou celular da criança, leia o QR code com a câmera
                  ou abra o app e digite o código abaixo.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4 py-2">
                <div className="rounded-2xl border bg-white p-4">
                  <QRCodeSVG
                    value={linkDePareamento(origin, turmaQr.codigo)}
                    size={240}
                    marginSize={1}
                    title={`QR code para entrar na turma ${turmaQr.nome}`}
                  />
                </div>
                <p
                  className="font-mono text-5xl font-extrabold tracking-[0.3em] text-primary"
                  aria-label={`Código ${turmaQr.codigo.split("").join(" ")}`}
                >
                  {turmaQr.codigo}
                </p>
                <p className="max-w-full text-center text-xs break-all text-muted-foreground">
                  {linkDePareamento(origin, turmaQr.codigo)}
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copiarLink(turmaQr)}
                >
                  <Copy />
                  Copiar link
                </Button>
                <Button type="button" onClick={() => setTurmaQr(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={turmaEdicao !== null}
        onOpenChange={(open) => {
          if (!open && !salvandoEdicao) setTurmaEdicao(null);
        }}
      >
        <DialogContent>
          <form onSubmit={handleEditar} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Editar turma</DialogTitle>
              <DialogDescription>
                Turmas inativas continuam com as crianças, mas deixam de
                aparecer como opção de entrada.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="editar-turma-nome">Nome da turma</FieldLabel>
                <Input
                  id="editar-turma-nome"
                  value={formEdicao.nome}
                  onChange={(event) =>
                    setFormEdicao((atual) => ({
                      ...atual,
                      nome: event.target.value,
                    }))
                  }
                  maxLength={120}
                  disabled={salvandoEdicao}
                  required
                />
              </Field>

              <Field orientation="horizontal">
                <Switch
                  id="editar-turma-ativa"
                  checked={formEdicao.ativa}
                  onCheckedChange={(checked) =>
                    setFormEdicao((atual) => ({ ...atual, ativa: checked }))
                  }
                  disabled={salvandoEdicao}
                />
                <FieldLabel htmlFor="editar-turma-ativa">Turma ativa</FieldLabel>
              </Field>
              <FieldDescription>
                Desative no fim do período letivo em vez de excluir.
              </FieldDescription>

              <FieldError>{erroEdicao}</FieldError>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTurmaEdicao(null)}
                disabled={salvandoEdicao}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoEdicao || !formEdicao.nome.trim()}
              >
                {salvandoEdicao ? <Spinner data-icon="inline-start" /> : null}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={turmaNovoCodigo !== null}
        onOpenChange={(open) => {
          if (!open) setTurmaNovoCodigo(null);
        }}
        title="Gerar novo código?"
        description={
          <>
            <p>
              O código atual{" "}
              <strong className="font-mono tracking-widest">
                {turmaNovoCodigo?.codigo}
              </strong>{" "}
              deixa de valer. Para parear um dispositivo depois disso, será
              preciso usar o novo código (ou o novo QR code).
            </p>
          </>
        }
        confirmLabel="Gerar novo código"
        loading={gerandoCodigo}
        onConfirm={handleNovoCodigo}
      />

      <ConfirmDialog
        open={turmaExclusao !== null}
        onOpenChange={(open) => {
          if (!open) setTurmaExclusao(null);
        }}
        title="Excluir turma?"
        description={
          <p>
            A turma <strong>{turmaExclusao?.nome}</strong> será excluída. Só é
            possível excluir turmas sem crianças.
          </p>
        }
        confirmLabel="Excluir turma"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </>
  );
}
