"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Orbit, Play, Users } from "lucide-react";

import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { mensagemDeErro } from "@/lib/api-errors";
import { ApiError } from "@/services/apiError";
import { formatDateTime } from "@/lib/format";
import { appToast } from "@/lib/toast";
import { listAulas, listTurmas } from "@/services/painel";
import { abrirRoda, listarRodas } from "@/services/roda";
import type { AulaResumo } from "@/types/Aula";
import type { RodaEstado, StatusRoda } from "@/types/Roda";
import type { Turma } from "@/types/Turma";

const DISCIPLINAS: Record<string, string> = { portugues: "Português", matematica: "Matemática", geografia: "Geografia", historia: "História" };

function StatusBadge({ status }: { status: StatusRoda }) {
  if (status === "em_andamento") return <Badge variant="success">Em andamento</Badge>;
  if (status === "aguardando") return <Badge variant="warning">Aguardando</Badge>;

  return <Badge variant="muted">Encerrada</Badge>;
}

export default function RodasPage() {
  const router = useRouter();
  const [rodas, setRodas] = useState<RodaEstado[] | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [aulas, setAulas] = useState<AulaResumo[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([listarRodas(), listTurmas(), listAulas()])
      .then(([lista, todasTurmas, todasAulas]) => {
        if (!ativo) return;

        setRodas(lista);
        setTurmas(todasTurmas.filter((t) => t.ativa));
        setAulas(todasAulas.filter((a) => a.status === "publicada"));
      })
      .catch((error) => {
        if (!ativo) return;

        setRodas([]);
        appToast.error(mensagemDeErro(error, "Não foi possível carregar as rodas."));
      });

    return () => {
      ativo = false;
    };
  }, []);

  const abertas = useMemo(() => (rodas ?? []).filter((r) => r.status !== "encerrada"), [rodas]);
  const encerradas = useMemo(() => (rodas ?? []).filter((r) => r.status === "encerrada"), [rodas]);

  async function abrir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (!turmaId || !aulaId) {
      setErro("Escolha a turma e a missão.");

      return;
    }

    setAbrindo(true);

    try {
      const roda = await abrirRoda(Number(turmaId), Number(aulaId));
      router.push(`/painel/rodas/${roda.id}`);
    } catch (error: unknown) {
      const corpo = error instanceof ApiError ? (error.body as { roda_id?: number } | null) : null;

      if (corpo?.roda_id) {
        setErro("Essa turma já tem uma roda aberta.");
        appToast.error("Essa turma já tem uma roda aberta. Conduza ou encerre a roda atual.");
        router.push(`/painel/rodas/${corpo.roda_id}`);
      } else {
        setErro(mensagemDeErro(error, "Não foi possível abrir a roda."));
      }
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title="Rodas"
        description="A Roda é a missão ao vivo: você conduz a etapa no seu dispositivo (ou no projetor) e as crianças acompanham no delas. Em duplas, uma propõe e a outra confirma. Crianças de turmas amigas entram pelo QR."
      />

      {rodas === null ? <PainelPageLoader label="Carregando rodas..." /> : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Abrir uma roda</CardTitle>
            <CardDescription>Uma roda aberta por turma. Só missões publicadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={abrir}>
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel htmlFor="roda-turma">Turma</FieldLabel>
                  <Select value={turmaId} onValueChange={setTurmaId} disabled={abrindo}>
                    <SelectTrigger id="roda-turma" className="w-full">
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
                  <FieldLabel htmlFor="roda-aula">Missão</FieldLabel>
                  <Select value={aulaId} onValueChange={setAulaId} disabled={abrindo}>
                    <SelectTrigger id="roda-aula" className="w-full">
                      <SelectValue placeholder="Escolha a missão" />
                    </SelectTrigger>
                    <SelectContent>
                      {aulas.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {DISCIPLINAS[a.disciplina] ?? a.disciplina} · {a.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>As crianças veem a etapa que você escolher; ao encerrar, a missão fica concluída para quem participou.</FieldDescription>
                </Field>
                <FieldError>{erro}</FieldError>
                <Button type="submit" className="w-full" disabled={abrindo || !turmaId || !aulaId}>
                  {abrindo ? <Spinner data-icon="inline-start" /> : <Play />}
                  Abrir roda
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {rodas && rodas.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
              <Orbit className="size-8 text-muted-foreground" aria-hidden />
              <p className="font-semibold">Nenhuma roda ainda</p>
              <p className="max-w-sm text-sm text-muted-foreground">Abra a primeira ao lado: as crianças da turma veem &quot;Roda aberta&quot; na Galáxia.</p>
            </div>
          ) : null}

          {abertas.length > 0 ? (
            <ul className="grid gap-4 lg:grid-cols-2" aria-label="Rodas abertas">
              {abertas.map((r) => (
                <li key={r.id}>
                  <Card className="h-full gap-4">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg leading-snug">
                          {DISCIPLINAS[r.aula.disciplina] ?? r.aula.disciplina} · {r.aula.rotulo}
                        </CardTitle>
                        <StatusBadge status={r.status} />
                      </div>
                      <CardDescription>
                        {r.turma.nome} · código <span className="font-mono font-bold tracking-widest">{r.codigo}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-4" aria-hidden />
                        {r.participantes.filter((p) => p.presente).length} na roda
                      </span>
                      <span>Etapa {r.etapa_atual} de {r.total_etapas}</span>
                    </CardContent>
                    <CardFooter>
                      <Button asChild>
                        <Link href={`/painel/rodas/${r.id}`}>
                          <Play />
                          Conduzir
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          ) : null}

          {encerradas.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas rodas encerradas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {encerradas.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        <strong>{r.aula.rotulo}</strong> · {r.turma.nome} · {r.participantes.length} {r.participantes.length === 1 ? "criança" : "crianças"}
                      </span>
                      <span className="text-muted-foreground">{formatDateTime(r.encerrada_em)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
