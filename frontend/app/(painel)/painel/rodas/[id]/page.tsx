"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Play, Shuffle, Square, Wifi, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

import { ConfirmDialog } from "@/components/painel/confirm-dialog";
import { OpcaoVisualIcone } from "@/components/painel/opcao-visual";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrigin } from "@/hooks/use-origin";
import { useRodaTempoReal } from "@/hooks/use-roda-tempo-real";
import { mensagemDeErro } from "@/lib/api-errors";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { descreverResposta } from "@/lib/roda/dupla";
import { comandarRoda, definirDuplas, buscarRodaPainel } from "@/services/roda";
import type { Atividade } from "@/types/CriancaApp";
import type { ComandoRoda, DuplaEstado, RodaPainel } from "@/types/Roda";

const NOME_TIPO: Record<string, string> = {
  historia: "História",
  conversa: "Conversa",
  palavra: "Palavra",
  palmas: "Palmas",
  ficha: "Ficha",
  montar_palavras: "Montar palavras",
  frase: "Frase",
  escolha: "Escolha",
  verdadeiro_falso: "Verdadeiro ou falso",
  ordenar: "Ordenar",
  linha_do_tempo: "Linha do tempo",
  parear: "Parear",
  contar: "Contar",
  somar_subtrair: "Somar e subtrair",
  escolher_silaba: "Escolher a sílaba",
  dinheiro: "Dinheiro",
  mapa_pontos: "Mapa",
  ditado: "Ditado",
};

function resumoDaAtividade(a: Atividade): string {
  if (a.tipo === "historia") return `${a.paginas.length} páginas`;
  if (a.tipo === "escolha" || a.tipo === "verdadeiro_falso") return a.itens.map((i) => i.pergunta).join(" · ");
  if (a.tipo === "montar_palavras") return `metas: ${a.metas.map((m) => m.palavra).join(", ")}`;
  if (a.tipo === "somar_subtrair") return a.itens.map((i) => `${i.a} ${i.operacao} ${i.b}`).join(" · ");
  if (a.tipo === "escolher_silaba") return a.itens.map((i) => i.pecas.map((p) => p ?? "_").join("-")).join(" · ");

  return a.instrucao ?? a.titulo ?? "";
}

export default function RodaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const rodaId = Number(id);
  const origin = useOrigin();
  const [dados, setDados] = useState<RodaPainel | null>(null);
  const [agindo, setAgindo] = useState(false);
  const [encerrar, setEncerrar] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      setDados(await buscarRodaPainel(rodaId));
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível carregar a roda."));
    }
  }, [rodaId]);

  useEffect(() => {
    let ativo = true;

    buscarRodaPainel(rodaId)
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch((error) => {
        if (ativo) appToast.error(mensagemDeErro(error, "Não foi possível carregar a roda."));
      });

    return () => {
      ativo = false;
    };
  }, [rodaId]);

  const { conectado, membros } = useRodaTempoReal({
    rodaId: Number.isInteger(rodaId) && rodaId > 0 ? rodaId : null,
    perfil: "educador",
    aoEstado: (roda) => setDados((atual) => (atual ? { ...atual, roda } : atual)),
    aoDupla: (dupla) =>
      setDados((atual) => (atual ? { ...atual, duplas: atual.duplas.some((d) => d.id === dupla.id) ? atual.duplas.map((d) => (d.id === dupla.id ? dupla : d)) : [...atual.duplas, dupla] } : atual)),
    recarregar,
  });

  async function comandar(comando: ComandoRoda) {
    setAgindo(true);

    try {
      const roda = await comandarRoda(rodaId, comando);
      setDados((atual) => (atual ? { ...atual, roda } : atual));

      if (comando.acao === "encerrar") {
        setEncerrar(false);
        appToast.success("Roda encerrada. A missão ficou concluída para quem participou.");
      }
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível enviar o comando."));
    } finally {
      setAgindo(false);
    }
  }

  async function duplasAutomaticas() {
    setAgindo(true);

    try {
      const r = await definirDuplas(rodaId, { automatico: true });
      setDados((atual) => (atual ? { ...atual, roda: r.roda, duplas: r.duplas } : atual));
      appToast.success(r.duplas.length === 1 ? "1 dupla formada." : `${r.duplas.length} duplas formadas.`);
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível formar as duplas."));
    } finally {
      setAgindo(false);
    }
  }

  if (!dados) {
    return <PainelPageLoader label="Carregando a roda..." />;
  }

  const { roda, conteudo, duplas } = dados;
  const encerrada = roda.status === "encerrada";
  const etapa = roda.etapa_atual;
  const atividade = conteudo.atividades[etapa - 1] ?? null;
  const online = new Set(membros.filter((m) => m.tipo === "crianca").map((m) => (m as { crianca_id: number }).crianca_id));
  const presentes = roda.participantes.filter((p) => p.presente);
  const link = origin ? `${origin}/app/roda?codigo=${roda.codigo}` : "";

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title={`Roda · ${roda.aula.rotulo}`}
        description={`${roda.turma.nome} · ${roda.aula.titulo}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={conectado ? "success" : "muted"}>
              {conectado ? <Wifi /> : <WifiOff />}
              {conectado ? "tempo real" : "atualizando a cada 5 s"}
            </Badge>
            <Badge variant={encerrada ? "muted" : roda.status === "em_andamento" ? "success" : "warning"}>
              {encerrada ? "Encerrada" : roda.status === "em_andamento" ? "Em andamento" : "Aguardando"}
            </Badge>
            <Button asChild variant="outline">
              <Link href="/painel/rodas">
                <ArrowLeft />
                Rodas
              </Link>
            </Button>
            {!encerrada ? (
              <Button type="button" variant="destructive" disabled={agindo} onClick={() => setEncerrar(true)}>
                <Square />
                Encerrar
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entrar na roda</CardTitle>
              <CardDescription>As crianças da turma veem &quot;Roda aberta&quot; na Galáxia. Turmas amigas entram por este QR ou link.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {link ? (
                <div className="rounded-lg border bg-white p-2">
                  <QRCodeSVG value={link} size={160} />
                </div>
              ) : null}
              <p className="font-mono text-3xl font-extrabold tracking-[0.25em] text-primary" aria-label={`Código ${roda.codigo.split("").join(" ")}`}>
                {roda.codigo}
              </p>
              {link ? <p className="text-xs break-all text-muted-foreground">{link}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Na roda ({presentes.length})</CardTitle>
              <CardDescription>Bolinha verde: conectada agora.</CardDescription>
            </CardHeader>
            <CardContent>
              {roda.participantes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém entrou ainda.</p>
              ) : (
                <ul className="flex flex-wrap gap-3" aria-label="Participantes">
                  {roda.participantes.map((p) => (
                    <li key={p.id} className={cn("flex items-center gap-2 rounded-full border px-2 py-1 text-sm", !p.presente && "opacity-50")}>
                      <span className="relative">
                        <OpcaoVisualIcone opcao={p.avatar} decorative sizeClassName="size-7 text-lg" />
                        {online.has(p.id) ? <span aria-label="conectada" className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" /> : null}
                      </span>
                      {p.apelido}
                      {!p.presente ? <span className="text-xs text-muted-foreground">(saiu)</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conduzir</CardTitle>
              <CardDescription>
                Etapa {etapa} de {roda.total_etapas}
                {atividade ? ` · ${NOME_TIPO[atividade.tipo] ?? atividade.tipo}` : etapa >= roda.total_etapas ? " · Conquista" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {roda.status === "aguardando" ? (
                  <Button type="button" disabled={agindo || encerrada} onClick={() => void comandar({ acao: "iniciar" })}>
                    <Play />
                    Começar
                  </Button>
                ) : null}
                <Button type="button" variant="outline" disabled={agindo || encerrada || etapa <= 1} onClick={() => void comandar({ acao: "voltar" })}>
                  <ArrowLeft />
                  Etapa anterior
                </Button>
                <Button type="button" disabled={agindo || encerrada || etapa >= roda.total_etapas} onClick={() => void comandar({ acao: "avancar" })}>
                  Próxima etapa
                  <ArrowRight />
                </Button>
              </div>

              <ol className="flex flex-wrap gap-2" aria-label="Etapas">
                {[...conteudo.atividades.map((a) => NOME_TIPO[a.tipo] ?? a.tipo), "Conquista"].map((nome, i) => {
                  const n = i + 1;
                  const atual = n === etapa;

                  return (
                    <li key={n}>
                      <button
                        type="button"
                        aria-current={atual ? "step" : undefined}
                        disabled={agindo || encerrada}
                        onClick={() => void comandar({ acao: "ir_etapa", valor: n })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
                          atual ? "border-primary bg-primary text-primary-foreground" : n < etapa ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-card hover:bg-muted",
                        )}
                      >
                        {n}. {nome}
                      </button>
                    </li>
                  );
                })}
              </ol>

              {atividade ? (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <p className="font-semibold">{atividade.titulo ?? NOME_TIPO[atividade.tipo] ?? atividade.tipo}</p>
                  <p className="text-muted-foreground">{atividade.instrucao ?? resumoDaAtividade(atividade)}</p>
                  {atividade.tipo === "montar_palavras" || atividade.avaliada ? (
                    <p className="mt-1 text-xs text-muted-foreground">Nesta etapa as duplas propõem e confirmam juntas.</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Etapa de acompanhar: as crianças seguem você.</p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Duplas</CardTitle>
                  <CardDescription>Sorteadas entre quem está na roda; quem sobra joga sozinho. Refazer troca todas.</CardDescription>
                </div>
                <Button type="button" variant="outline" disabled={agindo || encerrada || presentes.length < 2} onClick={() => void duplasAutomaticas()}>
                  <Shuffle />
                  {duplas.length > 0 ? "Refazer duplas" : "Fazer duplas"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {duplas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem duplas: cada criança responde sozinha.</p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2" aria-label="Duplas">
                  {duplas.map((d) => (
                    <li key={d.id}>
                      <LinhaDupla dupla={d} atividade={conteudo.atividades[(d.tentativa?.atividade_ordem ?? etapa) - 1] ?? null} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={encerrar}
        onOpenChange={setEncerrar}
        title="Encerrar a roda?"
        description={<p>A missão fica concluída para todas as crianças que entraram (XP da missão na primeira vez). A roda não pode ser reaberta.</p>}
        confirmLabel="Encerrar"
        destructive
        loading={agindo}
        onConfirm={() => void comandar({ acao: "encerrar" })}
      />
    </div>
  );
}

function LinhaDupla({ dupla, atividade }: { dupla: DuplaEstado; atividade: Atividade | null }) {
  const [a, b] = dupla.criancas;
  const vez = dupla.criancas.find((c) => c.id === dupla.vez_de);
  const t = dupla.tentativa;

  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold">
        <OpcaoVisualIcone opcao={a?.avatar} decorative sizeClassName="size-7 text-lg" />
        {a?.apelido}
        <span className="text-muted-foreground">↔</span>
        <OpcaoVisualIcone opcao={b?.avatar} decorative sizeClassName="size-7 text-lg" />
        {b?.apelido}
      </div>
      <p className="text-muted-foreground">Vez de {vez?.apelido ?? "—"}.</p>
      {t ? (
        <p className="flex flex-wrap items-center gap-1.5">
          {t.status === "proposta" ? <Badge variant="warning">proposta</Badge> : t.status === "recusada" ? <Badge variant="muted">vamos mudar</Badge> : t.valida ? <Badge variant="success"><Check />certa</Badge> : <Badge variant="info"><X />dica</Badge>}
          <span className="font-mono">{descreverResposta(atividade, t.resposta)}</span>
          {t.status === "confirmada" && !t.valida && t.dica ? <span className="text-muted-foreground">· {t.dica}</span> : null}
        </p>
      ) : (
        <p className="text-muted-foreground">Nenhuma proposta ainda.</p>
      )}
      {dupla.palavras.length > 0 ? <p className="text-xs text-muted-foreground">Palavras da dupla: {dupla.palavras.map((p) => p.palavra).join(", ")}</p> : null}
    </div>
  );
}
