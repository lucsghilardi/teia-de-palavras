"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  Pencil,
  ShieldCheck,
  Smile,
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";

import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { OpcaoVisualGrid, OpcaoVisualIcone } from "@/components/painel/opcao-visual";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { mensagemDeErro } from "@/lib/api-errors";
import { formatDateTime, formatLocalDate } from "@/lib/format";
import { appToast } from "@/lib/toast";
import {
  createCrianca,
  deleteCrianca,
  getConfiguracoes,
  getOpcoesVisuais,
  listCriancas,
  listTurmas,
  redefinirFiguraSecreta,
  solicitarExclusaoCrianca,
  updateCrianca,
} from "@/services/painel";
import type { Configuracoes } from "@/types/Configuracoes";
import type { Crianca } from "@/types/Crianca";
import type { OpcoesVisuais } from "@/types/OpcaoVisual";
import type { Turma } from "@/types/Turma";

const TODAS = "todas";

type FormCadastro = {
  turma_id: string;
  apelido: string;
  avatar_chave: string | null;
  figura_secreta_chave: string | null;
  usa_minusculas: boolean;
  narracao_automatica: boolean;
  consentimento: boolean;
};

type FormEdicao = {
  turma_id: string;
  apelido: string;
  avatar_chave: string | null;
  usa_minusculas: boolean;
  narracao_automatica: boolean;
};

const formCadastroVazio: FormCadastro = {
  turma_id: "",
  apelido: "",
  avatar_chave: null,
  figura_secreta_chave: null,
  usa_minusculas: true,
  narracao_automatica: true,
  consentimento: false,
};

function ordenarCriancas(criancas: Crianca[]) {
  return [...criancas].sort((a, b) =>
    a.apelido.localeCompare(b.apelido, "pt-BR", { sensitivity: "base" }),
  );
}

function parseTurmaId(valor: string | null) {
  return valor && /^\d+$/.test(valor) ? Number(valor) : null;
}

export default function CriancasPage() {
  // useSearchParams exige Suspense para o build estático do Next 16.
  return (
    <Suspense fallback={<PainelPageLoader label="Carregando crianças..." />}>
      <CriancasConteudo />
    </Suspense>
  );
}

function CriancasConteudo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const turmaFiltro = parseTurmaId(searchParams.get("turma_id"));
  const chaveLista = turmaFiltro === null ? TODAS : String(turmaFiltro);

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [opcoes, setOpcoes] = useState<OpcoesVisuais>({ avatares: [], figuras: [] });
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [carregandoBase, setCarregandoBase] = useState(true);

  // A lista guarda para qual filtro foi carregada: enquanto a chave não bate,
  // a tabela mostra o carregamento (sem setState síncrono no efeito).
  const [lista, setLista] = useState<{ chave: string; criancas: Crianca[] } | null>(null);
  const [agora, setAgora] = useState(0);
  const carregandoLista = lista?.chave !== chaveLista;
  const criancas = useMemo(() => lista?.criancas ?? [], [lista]);

  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [formCadastro, setFormCadastro] = useState<FormCadastro>(formCadastroVazio);
  const [tentouCadastrar, setTentouCadastrar] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);

  const [criancaEdicao, setCriancaEdicao] = useState<Crianca | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormEdicao | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [criancaFigura, setCriancaFigura] = useState<Crianca | null>(null);
  const [novaFigura, setNovaFigura] = useState<string | null>(null);
  const [salvandoFigura, setSalvandoFigura] = useState(false);

  const [criancaPedidoExclusao, setCriancaPedidoExclusao] = useState<Crianca | null>(null);
  const [registrandoPedido, setRegistrandoPedido] = useState(false);
  const [criancaExclusao, setCriancaExclusao] = useState<Crianca | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.allSettled([listTurmas(), getOpcoesVisuais(), getConfiguracoes()]).then(
      ([turmasResult, opcoesResult, configResult]) => {
        if (!ativo) {
          return;
        }

        if (turmasResult.status === "fulfilled") {
          setTurmas(
            [...turmasResult.value].sort((a, b) =>
              a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
            ),
          );
        } else {
          appToast.error(
            mensagemDeErro(turmasResult.reason, "Não foi possível carregar as turmas."),
          );
        }

        if (opcoesResult.status === "fulfilled") {
          setOpcoes(opcoesResult.value);
        } else {
          appToast.error(
            mensagemDeErro(
              opcoesResult.reason,
              "Não foi possível carregar os avatares e figuras.",
            ),
          );
        }

        if (configResult.status === "fulfilled") {
          setConfiguracoes(configResult.value);
        }

        setCarregandoBase(false);
      },
    );

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    listCriancas({ turma_id: turmaFiltro })
      .then((data) => {
        if (ativo) {
          setAgora(Date.now());
          setLista({ chave: chaveLista, criancas: ordenarCriancas(data) });
        }
      })
      .catch((error) => {
        if (ativo) {
          appToast.error(
            mensagemDeErro(error, "Não foi possível carregar as crianças."),
          );
          setLista({ chave: chaveLista, criancas: [] });
        }
      });

    return () => {
      ativo = false;
    };
  }, [chaveLista, turmaFiltro]);

  const turmaSelecionada = turmas.find((turma) => turma.id === turmaFiltro) ?? null;

  function mudarFiltro(valor: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (valor === TODAS) {
      params.delete("turma_id");
    } else {
      params.set("turma_id", valor);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function pertenceAoFiltro(crianca: Crianca) {
    return turmaFiltro === null || crianca.turma.id === turmaFiltro;
  }

  function aplicarNaLista(atualizar: (criancas: Crianca[]) => Crianca[]) {
    setLista((atual) =>
      atual ? { ...atual, criancas: ordenarCriancas(atualizar(atual.criancas)) } : atual,
    );
  }

  function substituirNaLista(atualizada: Crianca) {
    aplicarNaLista((atuais) =>
      atuais
        .map((crianca) => (crianca.id === atualizada.id ? atualizada : crianca))
        .filter(pertenceAoFiltro),
    );
  }

  // ===== Cadastro =====

  function abrirCadastro() {
    setFormCadastro({
      ...formCadastroVazio,
      turma_id: turmaFiltro !== null ? String(turmaFiltro) : turmas.length === 1 ? String(turmas[0].id) : "",
    });
    setTentouCadastrar(false);
    setErroCadastro(null);
    setCadastroAberto(true);
  }

  const pendenciasCadastro = useMemo(() => {
    const faltando: string[] = [];

    if (!formCadastro.turma_id) faltando.push("Escolha a turma.");
    if (formCadastro.apelido.trim().length < 2) faltando.push("O apelido precisa de pelo menos 2 letras.");
    if (!formCadastro.avatar_chave) faltando.push("Escolha um avatar.");
    if (!formCadastro.figura_secreta_chave) faltando.push("Escolha a figura secreta.");
    if (!formCadastro.consentimento) faltando.push("É preciso aceitar o termo de consentimento.");

    return faltando;
  }, [formCadastro]);

  async function handleCadastrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTentouCadastrar(true);
    setErroCadastro(null);

    if (!configuracoes) {
      setErroCadastro("O termo de consentimento não foi carregado. Recarregue a página.");
      return;
    }

    if (
      pendenciasCadastro.length > 0 ||
      !formCadastro.avatar_chave ||
      !formCadastro.figura_secreta_chave
    ) {
      return;
    }

    setCadastrando(true);

    try {
      const criada = await createCrianca({
        turma_id: Number(formCadastro.turma_id),
        apelido: formCadastro.apelido.trim(),
        avatar_chave: formCadastro.avatar_chave,
        figura_secreta_chave: formCadastro.figura_secreta_chave,
        usa_minusculas: formCadastro.usa_minusculas,
        narracao_automatica: formCadastro.narracao_automatica,
        consentimento: {
          aceito: true,
          versao_texto: configuracoes.consentimento_versao,
        },
      });

      if (pertenceAoFiltro(criada)) {
        aplicarNaLista((atuais) => [criada, ...atuais]);
      }

      setCadastroAberto(false);
      setFormCadastro(formCadastroVazio);
      appToast.success(`${criada.apelido} foi cadastrada na turma ${criada.turma.nome}.`);
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível cadastrar a criança.");

      setErroCadastro(mensagem);
      appToast.error(mensagem);
    } finally {
      setCadastrando(false);
    }
  }

  // ===== Edição =====

  function abrirEdicao(crianca: Crianca) {
    setCriancaEdicao(crianca);
    setFormEdicao({
      turma_id: String(crianca.turma.id),
      apelido: crianca.apelido,
      avatar_chave: crianca.avatar?.chave ?? null,
      usa_minusculas: crianca.usa_minusculas,
      narracao_automatica: crianca.narracao_automatica,
    });
    setErroEdicao(null);
  }

  function fecharEdicao(open: boolean) {
    if (!open && !salvandoEdicao) {
      setCriancaEdicao(null);
      setFormEdicao(null);
    }
  }

  async function handleEditar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!criancaEdicao || !formEdicao) {
      return;
    }

    if (!formEdicao.avatar_chave || !formEdicao.turma_id) {
      setErroEdicao("Escolha a turma e o avatar.");
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao(null);

    try {
      const atualizada = await updateCrianca(criancaEdicao.id, {
        apelido: formEdicao.apelido.trim(),
        avatar_chave: formEdicao.avatar_chave,
        usa_minusculas: formEdicao.usa_minusculas,
        narracao_automatica: formEdicao.narracao_automatica,
        turma_id: Number(formEdicao.turma_id),
      });

      substituirNaLista(atualizada);
      setCriancaEdicao(null);
      setFormEdicao(null);
      appToast.success("Dados da criança atualizados.");
    } catch (error) {
      const mensagem = mensagemDeErro(error, "Não foi possível salvar as alterações.");

      setErroEdicao(mensagem);
      appToast.error(mensagem);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // ===== Figura secreta =====

  function abrirFigura(crianca: Crianca) {
    setCriancaFigura(crianca);
    setNovaFigura(null);
  }

  async function handleRedefinirFigura() {
    if (!criancaFigura || !novaFigura) {
      return;
    }

    setSalvandoFigura(true);

    try {
      const atualizada = await redefinirFiguraSecreta(criancaFigura.id, novaFigura);

      setAgora(Date.now());
      substituirNaLista(atualizada);
      setCriancaFigura(null);
      appToast.success(`Figura secreta de ${atualizada.apelido} redefinida.`);
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível redefinir a figura secreta."));
    } finally {
      setSalvandoFigura(false);
    }
  }

  // ===== Exclusão =====

  async function handleSolicitarExclusao() {
    if (!criancaPedidoExclusao) {
      return;
    }

    setRegistrandoPedido(true);

    try {
      const atualizada = await solicitarExclusaoCrianca(criancaPedidoExclusao.id);

      substituirNaLista(atualizada);
      setCriancaPedidoExclusao(null);
      appToast.success("Pedido de exclusão registrado.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível registrar o pedido."));
    } finally {
      setRegistrandoPedido(false);
    }
  }

  async function handleExcluir() {
    if (!criancaExclusao) {
      return;
    }

    setExcluindo(true);

    try {
      await deleteCrianca(criancaExclusao.id);

      aplicarNaLista((atuais) =>
        atuais.filter((crianca) => crianca.id !== criancaExclusao.id),
      );
      setCriancaExclusao(null);
      appToast.success("Criança removida.");
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível remover a criança."));
    } finally {
      setExcluindo(false);
    }
  }

  if (carregandoBase) {
    return <PainelPageLoader label="Carregando crianças..." />;
  }

  const semTurmas = turmas.length === 0;
  const mostrarErrosCadastro = tentouCadastrar && pendenciasCadastro.length > 0;

  return (
    <>
      <div className="space-y-6">
        <PainelPageHeader
          title="Crianças"
          description="Cadastro feito pelo responsável, com consentimento. A criança tem só apelido, avatar e turma — nunca nome completo, e-mail ou foto."
          actions={
            <Button type="button" onClick={abrirCadastro} disabled={semTurmas}>
              <UserPlus className="size-4" />
              Cadastrar criança
            </Button>
          }
        />

        {semTurmas ? (
          <Alert variant="info" role="status">
            <Smile />
            <AlertTitle>Crie uma turma primeiro</AlertTitle>
            <AlertDescription>
              <p>
                Toda criança pertence a uma turma.{" "}
                <Link href="/painel/turmas" className="font-semibold underline">
                  Ir para Turmas
                </Link>
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader className="gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <CardTitle>
                {turmaSelecionada ? `Crianças · ${turmaSelecionada.nome}` : "Todas as crianças"}
              </CardTitle>
              <CardDescription>
                {carregandoLista
                  ? "Carregando..."
                  : criancas.length === 1
                    ? "1 criança"
                    : `${criancas.length} crianças`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1.5 md:min-w-64">
              <label htmlFor="filtro-turma" className="text-sm font-medium">
                Filtrar por turma
              </label>
              <Select
                value={turmaFiltro === null ? TODAS : String(turmaFiltro)}
                onValueChange={mudarFiltro}
              >
                <SelectTrigger id="filtro-turma" className="w-full">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={String(turma.id)}>
                      {turma.nome}
                      {turma.ativa ? "" : " (inativa)"}
                    </SelectItem>
                  ))}
                  {turmaFiltro !== null && !turmaSelecionada ? (
                    <SelectItem value={String(turmaFiltro)}>
                      Turma #{turmaFiltro}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {carregandoLista ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                <Spinner />
                Carregando crianças...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[14rem] pl-6">Criança</TableHead>
                      <TableHead className="min-w-[10rem]">Turma</TableHead>
                      <TableHead className="min-w-[12rem]">Situação</TableHead>
                      <TableHead className="min-w-[12rem]">Cadastro</TableHead>
                      <TableHead className="min-w-[16rem] pr-6 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criancas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          Nenhuma criança {turmaSelecionada ? "nesta turma" : "cadastrada"}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      criancas.map((crianca) => {
                        const bloqueada =
                          crianca.bloqueada_ate !== null &&
                          new Date(crianca.bloqueada_ate).getTime() > agora;

                        return (
                          <TableRow key={crianca.id}>
                            <TableCell className="pl-6 align-middle">
                              <div className="flex items-center gap-3">
                                <span className="flex size-12 items-center justify-center rounded-2xl bg-muted/60">
                                  <OpcaoVisualIcone
                                    opcao={crianca.avatar}
                                    sizeClassName="size-9 text-3xl"
                                  />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold break-words">{crianca.apelido}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {crianca.usa_minusculas ? "Texto como escrito" : "Só letras maiúsculas"}
                                    {crianca.narracao_automatica ? "" : " · narração só no alto-falante"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <p className="font-medium">{crianca.turma.nome}</p>
                              <p className="font-mono text-xs tracking-widest text-muted-foreground">
                                {crianca.turma.codigo}
                              </p>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex flex-wrap gap-1.5">
                                {bloqueada ? (
                                  <Badge variant="warning">
                                    Bloqueada até {formatDateTime(crianca.bloqueada_ate)}
                                  </Badge>
                                ) : null}
                                {crianca.exclusao_solicitada_em ? (
                                  <Badge variant="destructive">
                                    Exclusão solicitada em{" "}
                                    {formatLocalDate(crianca.exclusao_solicitada_em)}
                                  </Badge>
                                ) : null}
                                {!bloqueada && !crianca.exclusao_solicitada_em ? (
                                  <Badge variant="success">Ativa</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="align-middle text-sm">
                              <p>{crianca.responsavel.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatLocalDate(crianca.created_at)}
                                {crianca.consentimento
                                  ? ` · termo ${crianca.consentimento.versao_texto}`
                                  : " · sem termo registrado"}
                              </p>
                            </TableCell>
                            <TableCell className="pr-6 align-middle">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirEdicao(crianca)}
                                >
                                  <Pencil />
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirFigura(crianca)}
                                  aria-label={`Redefinir figura secreta de ${crianca.apelido}`}
                                >
                                  <KeyRound />
                                  Figura secreta
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => setCriancaPedidoExclusao(crianca)}
                                  disabled={crianca.exclusao_solicitada_em !== null}
                                  aria-label={`Solicitar exclusão de dados de ${crianca.apelido}`}
                                  title="Solicitar exclusão de dados"
                                >
                                  <UserX />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setCriancaExclusao(crianca)}
                                  aria-label={`Excluir ${crianca.apelido}`}
                                  title="Excluir"
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Cadastro ===== */}
      <Sheet
        open={cadastroAberto}
        onOpenChange={(open) => {
          if (!cadastrando) setCadastroAberto(open);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <form onSubmit={handleCadastrar} noValidate className="flex min-h-full flex-col">
            <SheetHeader className="border-b">
              <SheetTitle>Cadastrar criança</SheetTitle>
              <SheetDescription>
                Só apelido, avatar e turma. Não informe nome completo, e-mail ou
                foto da criança.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-4 py-5">
              <FieldGroup className="gap-6">
                <Field data-invalid={mostrarErrosCadastro && !formCadastro.turma_id ? true : undefined}>
                  <FieldLabel htmlFor="cadastro-turma">Turma</FieldLabel>
                  <Select
                    value={formCadastro.turma_id}
                    onValueChange={(valor) =>
                      setFormCadastro((atual) => ({ ...atual, turma_id: valor }))
                    }
                    disabled={cadastrando}
                  >
                    <SelectTrigger id="cadastro-turma" className="w-full">
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={String(turma.id)}>
                          {turma.nome} ({turma.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="cadastro-apelido">Apelido</FieldLabel>
                  <Input
                    id="cadastro-apelido"
                    value={formCadastro.apelido}
                    onChange={(event) =>
                      setFormCadastro((atual) => ({ ...atual, apelido: event.target.value }))
                    }
                    placeholder="Ex.: Tatu, Bia, Juju"
                    autoComplete="off"
                    minLength={2}
                    maxLength={40}
                    disabled={cadastrando}
                    aria-invalid={
                      mostrarErrosCadastro && formCadastro.apelido.trim().length < 2
                        ? true
                        : undefined
                    }
                    required
                  />
                  <FieldDescription>
                    Como a criança é chamada na turma (2 a 40 letras, único na turma).
                    Evite o nome completo.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldTitle>Avatar</FieldTitle>
                  <FieldDescription>
                    A criança reconhece o próprio avatar para entrar no app.
                  </FieldDescription>
                  {opcoes.avatares.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum avatar disponível.</p>
                  ) : (
                    <OpcaoVisualGrid
                      label="Avatar da criança"
                      opcoes={opcoes.avatares}
                      value={formCadastro.avatar_chave}
                      onChange={(chave) =>
                        setFormCadastro((atual) => ({ ...atual, avatar_chave: chave }))
                      }
                      disabled={cadastrando}
                      invalid={mostrarErrosCadastro && !formCadastro.avatar_chave}
                    />
                  )}
                </Field>

                <Field>
                  <FieldTitle>Figura secreta</FieldTitle>
                  <FieldDescription>
                    É a “senha” da criança: ela toca nesta figura para entrar.
                    Conte só para ela e para o responsável.
                  </FieldDescription>
                  {opcoes.figuras.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma figura disponível.</p>
                  ) : (
                    <OpcaoVisualGrid
                      label="Figura secreta"
                      layout="figura"
                      opcoes={opcoes.figuras}
                      value={formCadastro.figura_secreta_chave}
                      onChange={(chave) =>
                        setFormCadastro((atual) => ({ ...atual, figura_secreta_chave: chave }))
                      }
                      disabled={cadastrando}
                      invalid={mostrarErrosCadastro && !formCadastro.figura_secreta_chave}
                    />
                  )}
                </Field>

                <Field orientation="horizontal">
                  <Switch
                    id="cadastro-minusculas"
                    checked={formCadastro.usa_minusculas}
                    onCheckedChange={(checked) =>
                      setFormCadastro((atual) => ({ ...atual, usa_minusculas: checked }))
                    }
                    disabled={cadastrando}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="cadastro-minusculas">Texto como escrito</FieldLabel>
                    <FieldDescription>
                      Frases em caso natural e peças em minúsculas. Desligado, o app mostra tudo em letras maiúsculas (leitores iniciantes).
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <Switch
                    id="cadastro-narracao"
                    checked={formCadastro.narracao_automatica}
                    onCheckedChange={(checked) =>
                      setFormCadastro((atual) => ({ ...atual, narracao_automatica: checked }))
                    }
                    disabled={cadastrando}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="cadastro-narracao">Narração automática</FieldLabel>
                    <FieldDescription>
                      Lê a história e a instrução ao chegar em cada tela. Desligada, a criança toca no alto-falante quando quiser ouvir.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                    Termo de consentimento
                    {configuracoes ? (
                      <Badge variant="outline">versão {configuracoes.consentimento_versao}</Badge>
                    ) : null}
                  </div>

                  {configuracoes ? (
                    <div
                      id="cadastro-termo"
                      tabIndex={0}
                      className="max-h-48 overflow-y-auto rounded-lg border bg-background p-3 text-sm leading-6 whitespace-pre-line outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {configuracoes.consentimento_texto}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">
                      Não foi possível carregar o termo. Recarregue a página para
                      cadastrar.
                    </p>
                  )}

                  <Field
                    orientation="horizontal"
                    data-invalid={mostrarErrosCadastro && !formCadastro.consentimento ? true : undefined}
                  >
                    <Checkbox
                      id="cadastro-consentimento"
                      checked={formCadastro.consentimento}
                      onCheckedChange={(checked) =>
                        setFormCadastro((atual) => ({ ...atual, consentimento: checked === true }))
                      }
                      disabled={cadastrando || !configuracoes}
                      aria-describedby="cadastro-termo"
                      aria-invalid={
                        mostrarErrosCadastro && !formCadastro.consentimento ? true : undefined
                      }
                    />
                    <FieldLabel htmlFor="cadastro-consentimento" className="leading-snug font-normal">
                      Sou o responsável (ou tenho a autorização dele) e aceito o
                      termo de consentimento acima.
                    </FieldLabel>
                  </Field>
                </div>

                {mostrarErrosCadastro ? (
                  <FieldError>
                    <ul className="ml-4 list-disc space-y-1">
                      {pendenciasCadastro.map((pendencia) => (
                        <li key={pendencia}>{pendencia}</li>
                      ))}
                    </ul>
                  </FieldError>
                ) : null}
                <FieldError>{erroCadastro}</FieldError>
              </FieldGroup>
            </div>

            <SheetFooter className="border-t sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCadastroAberto(false)}
                disabled={cadastrando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={cadastrando || !configuracoes}>
                {cadastrando ? <Spinner data-icon="inline-start" /> : <UserPlus />}
                Cadastrar
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ===== Edição ===== */}
      <Sheet open={criancaEdicao !== null} onOpenChange={fecharEdicao}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {criancaEdicao && formEdicao ? (
            <form onSubmit={handleEditar} className="flex min-h-full flex-col">
              <SheetHeader className="border-b">
                <SheetTitle>Editar {criancaEdicao.apelido}</SheetTitle>
                <SheetDescription>
                  Para trocar a figura secreta, use “Figura secreta” na lista.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 px-4 py-5">
                <FieldGroup className="gap-6">
                  <Field>
                    <FieldLabel htmlFor="edicao-turma">Turma</FieldLabel>
                    <Select
                      value={formEdicao.turma_id}
                      onValueChange={(valor) =>
                        setFormEdicao((atual) => (atual ? { ...atual, turma_id: valor } : atual))
                      }
                      disabled={salvandoEdicao}
                    >
                      <SelectTrigger id="edicao-turma" className="w-full">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={String(turma.id)}>
                            {turma.nome} ({turma.codigo})
                          </SelectItem>
                        ))}
                        {turmas.some((turma) => String(turma.id) === formEdicao.turma_id) ? null : (
                          <SelectItem value={formEdicao.turma_id}>
                            {criancaEdicao.turma.nome} ({criancaEdicao.turma.codigo})
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edicao-apelido">Apelido</FieldLabel>
                    <Input
                      id="edicao-apelido"
                      value={formEdicao.apelido}
                      onChange={(event) =>
                        setFormEdicao((atual) =>
                          atual ? { ...atual, apelido: event.target.value } : atual,
                        )
                      }
                      autoComplete="off"
                      minLength={2}
                      maxLength={40}
                      disabled={salvandoEdicao}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldTitle>Avatar</FieldTitle>
                    <OpcaoVisualGrid
                      label="Avatar da criança"
                      opcoes={opcoes.avatares}
                      value={formEdicao.avatar_chave}
                      onChange={(chave) =>
                        setFormEdicao((atual) => (atual ? { ...atual, avatar_chave: chave } : atual))
                      }
                      disabled={salvandoEdicao}
                    />
                  </Field>

                  <Field orientation="horizontal">
                    <Switch
                      id="edicao-minusculas"
                      checked={formEdicao.usa_minusculas}
                      onCheckedChange={(checked) =>
                        setFormEdicao((atual) =>
                          atual ? { ...atual, usa_minusculas: checked } : atual,
                        )
                      }
                      disabled={salvandoEdicao}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="edicao-minusculas">Texto como escrito</FieldLabel>
                      <FieldDescription>
                        Frases em caso natural e peças em minúsculas. Desligado, tudo em letras maiúsculas.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <Switch
                      id="edicao-narracao"
                      checked={formEdicao.narracao_automatica}
                      onCheckedChange={(checked) =>
                        setFormEdicao((atual) =>
                          atual ? { ...atual, narracao_automatica: checked } : atual,
                        )
                      }
                      disabled={salvandoEdicao}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="edicao-narracao">Narração automática</FieldLabel>
                      <FieldDescription>
                        Lê a história e a instrução ao chegar em cada tela.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <FieldError>{erroEdicao}</FieldError>
                </FieldGroup>
              </div>

              <SheetFooter className="border-t sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fecharEdicao(false)}
                  disabled={salvandoEdicao}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvandoEdicao || formEdicao.apelido.trim().length < 2}>
                  {salvandoEdicao ? <Spinner data-icon="inline-start" /> : null}
                  Salvar alterações
                </Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ===== Figura secreta ===== */}
      <Dialog
        open={criancaFigura !== null}
        onOpenChange={(open) => {
          if (!open && !salvandoFigura) setCriancaFigura(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir figura secreta</DialogTitle>
            <DialogDescription>
              Escolha a nova figura de {criancaFigura?.apelido}. Isso também
              desbloqueia a entrada, se ela estiver bloqueada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2">
            <OpcaoVisualGrid
              label="Nova figura secreta"
              layout="figura"
              opcoes={opcoes.figuras}
              value={novaFigura}
              onChange={setNovaFigura}
              disabled={salvandoFigura}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCriancaFigura(null)}
              disabled={salvandoFigura}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRedefinirFigura}
              disabled={salvandoFigura || !novaFigura}
            >
              {salvandoFigura ? <Spinner data-icon="inline-start" /> : <KeyRound />}
              Redefinir figura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={criancaPedidoExclusao !== null}
        onOpenChange={(open) => {
          if (!open) setCriancaPedidoExclusao(null);
        }}
        title="Solicitar exclusão de dados?"
        description={
          <>
            <p>
              Registra que o responsável pediu a exclusão dos dados de{" "}
              <strong>{criancaPedidoExclusao?.apelido}</strong> (LGPD).
            </p>
            <p>A data do pedido fica marcada na lista de crianças.</p>
          </>
        }
        confirmLabel="Registrar pedido"
        loading={registrandoPedido}
        onConfirm={handleSolicitarExclusao}
      />

      <ConfirmDialog
        open={criancaExclusao !== null}
        onOpenChange={(open) => {
          if (!open) setCriancaExclusao(null);
        }}
        title="Excluir criança?"
        description={
          <>
            <p>
              <strong>{criancaExclusao?.apelido}</strong> deixa de aparecer no
              painel e não consegue mais entrar no app.
            </p>
            <p>As gravações de áudio são apagadas depois, por rotina automática.</p>
          </>
        }
        confirmLabel="Excluir criança"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </>
  );
}
