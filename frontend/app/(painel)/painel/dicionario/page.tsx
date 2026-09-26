"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FileUp, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { CaixaAltaInput } from "@/components/painel/caixa-alta-input";
import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { PainelPageHeader } from "@/components/painel/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  FieldContent,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { mensagemDeErro } from "@/lib/api-errors";
import {
  juntarSilabas,
  separarSilabas,
  silabasFormamPalavra,
} from "@/lib/silabas";
import { appToast } from "@/lib/toast";
import {
  createPalavra,
  deletePalavra,
  importarDicionario,
  listDicionario,
  updatePalavra,
} from "@/services/painel";
import type { ImportarDicionarioResponse, Palavra } from "@/types/Palavra";

type FiltroAprovada = "todas" | "aprovadas" | "pendentes";

const ROTULO_ORIGEM: Record<string, string> = {
  cms: "Painel",
};

function rotuloOrigem(origem: string) {
  return ROTULO_ORIGEM[origem] ?? origem.charAt(0).toUpperCase() + origem.slice(1);
}

function filtroParaParametro(filtro: FiltroAprovada) {
  if (filtro === "aprovadas") return true;
  if (filtro === "pendentes") return false;
  return null;
}

/** Aviso quando as sílabas digitadas não formam a palavra. */
function avisoSilabas(palavra: string, silabas: string) {
  const partes = separarSilabas(silabas);

  if (!palavra.trim() || partes.length === 0 || silabasFormamPalavra(palavra, partes)) {
    return null;
  }

  return `Juntas, as sílabas formam “${partes.join("")}”, não “${palavra.trim()}”.`;
}

export default function DicionarioPage() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [filtro, setFiltro] = useState<FiltroAprovada>("todas");
  const [recarga, setRecarga] = useState(0);
  const chaveLista = `${buscaAplicada}|${filtro}|${recarga}`;

  const [lista, setLista] = useState<{ chave: string; palavras: Palavra[] } | null>(null);
  const carregando = lista?.chave !== chaveLista;
  const palavras = useMemo(() => lista?.palavras ?? [], [lista]);

  const [nova, setNova] = useState({ palavra: "", silabas: "" });
  const [criando, setCriando] = useState(false);
  const [erroNova, setErroNova] = useState<string | null>(null);

  const [textoImportacao, setTextoImportacao] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] =
    useState<ImportarDicionarioResponse | null>(null);

  const [palavraEdicao, setPalavraEdicao] = useState<Palavra | null>(null);
  const [formEdicao, setFormEdicao] = useState({ palavra: "", silabas: "", aprovada: true });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [palavraExclusao, setPalavraExclusao] = useState<Palavra | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [aprovandoId, setAprovandoId] = useState<number | null>(null);

  // Busca com espera curta: não dispara uma requisição por tecla.
  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaAplicada(busca.trim()), 350);

    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let ativo = true;

    listDicionario({ busca: buscaAplicada, aprovada: filtroParaParametro(filtro) })
      .then((data) => {
        if (ativo) setLista({ chave: chaveLista, palavras: data });
      })
      .catch((error) => {
        if (!ativo) return;

        appToast.error(mensagemDeErro(error, "Não foi possível carregar o dicionário."));
        setLista({ chave: chaveLista, palavras: [] });
      });

    return () => {
      ativo = false;
    };
  }, [buscaAplicada, filtro, chaveLista]);

  function atualizarNaLista(atualizada: Palavra) {
    setLista((atual) =>
      atual
        ? {
            ...atual,
            palavras: atual.palavras.map((item) => (item.id === atualizada.id ? atualizada : item)),
          }
        : atual,
    );
  }

  async function handleCriar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCriando(true);
    setErroNova(null);

    try {
      const criada = await createPalavra({
        palavra: nova.palavra.trim(),
        silabas: separarSilabas(nova.silabas),
      });

      setNova({ palavra: "", silabas: "" });
      setLista((atual) =>
        atual && filtro !== "pendentes"
          ? { ...atual, palavras: [criada, ...atual.palavras.filter((item) => item.id !== criada.id)] }
          : atual,
      );
      appToast.success(`${criada.palavra} entrou no dicionário.`);
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível adicionar a palavra.");

      setErroNova(mensagem);
      appToast.error(mensagem);
    } finally {
      setCriando(false);
    }
  }

  async function handleImportar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportando(true);
    setResultadoImportacao(null);

    try {
      const resultado = await importarDicionario(textoImportacao);

      setResultadoImportacao(resultado);
      setRecarga((valor) => valor + 1);

      if (resultado.ignoradas.length === 0) {
        setTextoImportacao("");
      }

      appToast.success(
        resultado.importadas === 1
          ? "1 palavra importada."
          : `${resultado.importadas} palavras importadas.`,
      );
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível importar as palavras."));
    } finally {
      setImportando(false);
    }
  }

  function abrirEdicao(palavra: Palavra) {
    setPalavraEdicao(palavra);
    setFormEdicao({
      palavra: palavra.palavra,
      silabas: juntarSilabas(palavra.silabas),
      aprovada: palavra.aprovada,
    });
    setErroEdicao(null);
  }

  async function handleEditar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!palavraEdicao) {
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao(null);

    try {
      const atualizada = await updatePalavra(palavraEdicao.id, {
        palavra: formEdicao.palavra.trim(),
        silabas: separarSilabas(formEdicao.silabas),
        aprovada: formEdicao.aprovada,
      });

      atualizarNaLista(atualizada);
      setPalavraEdicao(null);
      appToast.success("Palavra atualizada.");
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível atualizar a palavra.");

      setErroEdicao(mensagem);
      appToast.error(mensagem);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function aprovar(palavra: Palavra) {
    setAprovandoId(palavra.id);

    try {
      const atualizada = await updatePalavra(palavra.id, {
        palavra: palavra.palavra,
        silabas: palavra.silabas,
        aprovada: true,
      });

      atualizarNaLista(atualizada);
      appToast.success(`${atualizada.palavra} aprovada.`);
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível aprovar a palavra."));
    } finally {
      setAprovandoId(null);
    }
  }

  async function handleExcluir() {
    if (!palavraExclusao) {
      return;
    }

    setExcluindo(true);

    try {
      await deletePalavra(palavraExclusao.id);
      setLista((atual) =>
        atual
          ? { ...atual, palavras: atual.palavras.filter((item) => item.id !== palavraExclusao.id) }
          : atual,
      );
      setPalavraExclusao(null);
      appToast.success("Palavra excluída.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível excluir a palavra."));
    } finally {
      setExcluindo(false);
    }
  }

  const avisoNova = avisoSilabas(nova.palavra, nova.silabas);
  const avisoEdicao = avisoSilabas(formEdicao.palavra, formEdicao.silabas);

  return (
    <>
      <div className="space-y-6">
        <PainelPageHeader
          title="Dicionário"
          description="Palavras válidas que as crianças podem formar juntando sílabas. Comparadas sem acento e em caixa alta, exibidas como cadastradas."
        />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar palavra</CardTitle>
                <CardDescription>Entra já aprovada.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCriar}>
                  <FieldGroup className="gap-5">
                    <Field>
                      <FieldLabel htmlFor="nova-palavra">Palavra</FieldLabel>
                      <CaixaAltaInput
                        id="nova-palavra"
                        value={nova.palavra}
                        onValueChange={(valor) =>
                          setNova((atual) => ({ ...atual, palavra: valor }))
                        }
                        placeholder="CASA"
                        autoComplete="off"
                        className="text-lg font-bold tracking-wide"
                        disabled={criando}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="nova-silabas">Sílabas</FieldLabel>
                      <CaixaAltaInput
                        id="nova-silabas"
                        value={nova.silabas}
                        onValueChange={(valor) =>
                          setNova((atual) => ({ ...atual, silabas: valor }))
                        }
                        placeholder="CA-SA"
                        autoComplete="off"
                        className="font-mono tracking-wide"
                        disabled={criando}
                        aria-invalid={avisoNova ? true : undefined}
                        aria-describedby="nova-silabas-ajuda"
                        required
                      />
                      <FieldDescription id="nova-silabas-ajuda">
                        {avisoNova ?? "Separe com hífen: CA-SA."}
                      </FieldDescription>
                    </Field>
                    <FieldError>{erroNova}</FieldError>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={criando || !nova.palavra.trim() || separarSilabas(nova.silabas).length === 0}
                    >
                      {criando ? <Spinner data-icon="inline-start" /> : <Plus />}
                      Adicionar
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Importar lista</CardTitle>
                <CardDescription>
                  Uma palavra por linha, seguida das sílabas: <code className="font-mono">CASA CA-SA</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleImportar} className="space-y-4">
                  <label htmlFor="importar-texto" className="sr-only">
                    Palavras para importar
                  </label>
                  <Textarea
                    id="importar-texto"
                    value={textoImportacao}
                    onChange={(event) => setTextoImportacao(event.target.value)}
                    rows={6}
                    className="min-h-32 font-mono"
                    placeholder={"CASA CA-SA\nBOLA BO-LA\nTATU TA-TU"}
                    disabled={importando}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    disabled={importando || !textoImportacao.trim()}
                  >
                    {importando ? <Spinner data-icon="inline-start" /> : <FileUp />}
                    Importar
                  </Button>
                </form>

                {resultadoImportacao ? (
                  <div className="mt-4 space-y-3" role="status" aria-live="polite">
                    <Alert variant={resultadoImportacao.ignoradas.length > 0 ? "warning" : "info"} role="status">
                      <AlertTitle>
                        {resultadoImportacao.importadas === 1
                          ? "1 palavra importada"
                          : `${resultadoImportacao.importadas} palavras importadas`}
                        {resultadoImportacao.ignoradas.length > 0
                          ? ` · ${resultadoImportacao.ignoradas.length} ignorada(s)`
                          : ""}
                      </AlertTitle>
                      {resultadoImportacao.ignoradas.length > 0 ? (
                        <AlertDescription>
                          <ul className="w-full space-y-1.5">
                            {resultadoImportacao.ignoradas.map((item, index) => (
                              <li key={`${item.linha}-${index}`} className="text-xs">
                                <code className="font-mono font-semibold">{item.linha || "(linha vazia)"}</code>
                                {" — "}
                                {item.motivo}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      ) : null}
                    </Alert>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <CardTitle>Palavras</CardTitle>
                <CardDescription>
                  {carregando
                    ? "Carregando..."
                    : palavras.length === 1
                      ? "1 palavra"
                      : `${palavras.length} palavras`}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar palavra"
                    aria-label="Buscar palavra"
                    className="pl-8 sm:w-56"
                  />
                </div>
                <Select value={filtro} onValueChange={(valor) => setFiltro(valor as FiltroAprovada)}>
                  <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por aprovação">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="aprovadas">Aprovadas</SelectItem>
                    <SelectItem value="pendentes">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {carregando && lista === null ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                  <Spinner />
                  Carregando dicionário...
                </div>
              ) : (
                <div className="overflow-x-auto" aria-busy={carregando}>
                  <Table className={carregando ? "opacity-60" : undefined}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[10rem] pl-6">Palavra</TableHead>
                        <TableHead className="min-w-[10rem]">Sílabas</TableHead>
                        <TableHead className="min-w-[7rem]">Origem</TableHead>
                        <TableHead className="min-w-[8rem]">Aprovada</TableHead>
                        <TableHead className="min-w-[8rem] pr-6 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {palavras.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            {buscaAplicada || filtro !== "todas"
                              ? "Nenhuma palavra encontrada com esses filtros."
                              : "O dicionário ainda está vazio."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        palavras.map((palavra) => (
                          <TableRow key={palavra.id}>
                            <TableCell className="pl-6 text-base font-bold tracking-wide">
                              {palavra.palavra}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {palavra.silabas.map((silaba, index) => (
                                  <span
                                    key={`${silaba}-${index}`}
                                    className="rounded-md bg-primary/5 px-1.5 py-0.5 font-mono text-sm font-semibold text-primary"
                                  >
                                    {silaba}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{rotuloOrigem(palavra.origem)}</Badge>
                            </TableCell>
                            <TableCell>
                              {palavra.aprovada ? (
                                <Badge variant="success">Aprovada</Badge>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="warning">Pendente</Badge>
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="outline"
                                    onClick={() => aprovar(palavra)}
                                    disabled={aprovandoId === palavra.id}
                                    aria-label={`Aprovar ${palavra.palavra}`}
                                    title="Aprovar"
                                  >
                                    {aprovandoId === palavra.id ? <Spinner /> : <Check />}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="pr-6">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => abrirEdicao(palavra)}
                                  aria-label={`Editar ${palavra.palavra}`}
                                  title="Editar"
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setPalavraExclusao(palavra)}
                                  aria-label={`Excluir ${palavra.palavra}`}
                                  title="Excluir"
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={palavraEdicao !== null}
        onOpenChange={(open) => {
          if (!open && !salvandoEdicao) setPalavraEdicao(null);
        }}
      >
        <DialogContent>
          <form onSubmit={handleEditar} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Editar palavra</DialogTitle>
              <DialogDescription>
                Ajuste a grafia, as sílabas ou a aprovação.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="editar-palavra">Palavra</FieldLabel>
                <CaixaAltaInput
                  id="editar-palavra"
                  value={formEdicao.palavra}
                  onValueChange={(valor) =>
                    setFormEdicao((atual) => ({ ...atual, palavra: valor }))
                  }
                  autoComplete="off"
                  className="text-lg font-bold tracking-wide"
                  disabled={salvandoEdicao}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="editar-silabas">Sílabas</FieldLabel>
                <CaixaAltaInput
                  id="editar-silabas"
                  value={formEdicao.silabas}
                  onValueChange={(valor) =>
                    setFormEdicao((atual) => ({ ...atual, silabas: valor }))
                  }
                  autoComplete="off"
                  className="font-mono tracking-wide"
                  disabled={salvandoEdicao}
                  aria-invalid={avisoEdicao ? true : undefined}
                  aria-describedby="editar-silabas-ajuda"
                  required
                />
                <FieldDescription id="editar-silabas-ajuda">
                  {avisoEdicao ?? "Separe com hífen: CA-SA."}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="editar-aprovada"
                  checked={formEdicao.aprovada}
                  onCheckedChange={(checked) =>
                    setFormEdicao((atual) => ({ ...atual, aprovada: checked }))
                  }
                  disabled={salvandoEdicao}
                />
                <FieldContent>
                  <FieldLabel htmlFor="editar-aprovada">Aprovada</FieldLabel>
                </FieldContent>
              </Field>
              <FieldError>{erroEdicao}</FieldError>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPalavraEdicao(null)}
                disabled={salvandoEdicao}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  salvandoEdicao ||
                  !formEdicao.palavra.trim() ||
                  separarSilabas(formEdicao.silabas).length === 0
                }
              >
                {salvandoEdicao ? <Spinner data-icon="inline-start" /> : null}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={palavraExclusao !== null}
        onOpenChange={(open) => {
          if (!open) setPalavraExclusao(null);
        }}
        title="Excluir palavra?"
        description={
          <p>
            <strong>{palavraExclusao?.palavra}</strong> sai do dicionário e deixa
            de ser reconhecida como palavra válida.
          </p>
        }
        confirmLabel="Excluir palavra"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </>
  );
}
