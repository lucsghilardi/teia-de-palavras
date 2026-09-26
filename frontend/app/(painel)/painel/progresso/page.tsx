"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, Medal, Mic, Network, Orbit, RotateCcw, Star } from "lucide-react";

import { OpcaoVisualIcone } from "@/components/painel/opcao-visual";
import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { iconePorNome } from "@/lib/icones";
import { mensagemDeErro } from "@/lib/api-errors";
import { formatDateTime, formatLocalDate } from "@/lib/format";
import { appToast } from "@/lib/toast";
import { getProgresso, listCriancas, listTurmas } from "@/services/painel";
import type { Crianca } from "@/types/Crianca";
import type { Progresso } from "@/types/Progresso";
import type { Turma } from "@/types/Turma";
import { createElement } from "react";

const DISCIPLINAS: Record<string, string> = { portugues: "Português", matematica: "Matemática", geografia: "Geografia", historia: "História" };

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>
      <p className="text-2xl font-extrabold tabular-nums">{valor}</p>
      {detalhe ? <p className="text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export default function ProgressoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [criancaId, setCriancaId] = useState("");
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;

    listTurmas()
      .then((lista) => {
        if (ativo) setTurmas(lista);
      })
      .catch((error) => appToast.error(mensagemDeErro(error, "Não foi possível carregar as turmas.")));

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!turmaId) return;

    let ativo = true;

    listCriancas({ turma_id: Number(turmaId) })
      .then((lista) => {
        if (ativo) setCriancas(lista);
      })
      .catch((error) => appToast.error(mensagemDeErro(error, "Não foi possível carregar as crianças.")));

    return () => {
      ativo = false;
    };
  }, [turmaId]);

  useEffect(() => {
    if (!criancaId) return;

    let ativo = true;
    const id = Number(criancaId);

    getProgresso(id)
      .then((dados) => {
        if (ativo) setProgresso(dados);
      })
      .catch((error) => {
        if (ativo) appToast.error(mensagemDeErro(error, "Não foi possível carregar o progresso."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [criancaId]);

  const p = progresso;

  return (
    <div className="space-y-6">
      <PainelPageHeader
        title="Progresso"
        description="O caminho de cada criança: missões por planeta, revisão, respostas, mini-aulas, rodas e medalhas. Cada criança é comparada só com ela mesma."
      />

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="progresso-turma">Turma</FieldLabel>
            <Select
              value={turmaId}
              onValueChange={(v) => {
                setTurmaId(v);
                setCriancaId("");
                setProgresso(null);
              }}
            >
              <SelectTrigger id="progresso-turma" className="w-full">
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
            <FieldLabel htmlFor="progresso-crianca">Criança</FieldLabel>
            <Select
              value={criancaId}
              onValueChange={(v) => {
                setCarregando(true);
                setProgresso(null);
                setCriancaId(v);
              }}
              disabled={!turmaId}
            >
              <SelectTrigger id="progresso-crianca" className="w-full">
                <SelectValue placeholder={turmaId ? "Escolha a criança" : "Escolha a turma primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {criancas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.apelido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {carregando && !p ? <PainelPageLoader label="Carregando o progresso..." /> : null}

      {!criancaId && !carregando ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <BarChart3 className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-semibold">Escolha uma criança</p>
          <p className="max-w-sm text-sm text-muted-foreground">Você vê só o caminho dela: sem nota, sem ranking, sem comparação com as outras.</p>
        </div>
      ) : null}

      {p ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <OpcaoVisualIcone opcao={p.crianca.avatar} decorative sizeClassName="size-12 text-3xl" />
                <div>
                  <CardTitle>{p.crianca.apelido}</CardTitle>
                  <CardDescription>
                    {p.crianca.turma?.nome ?? "sem turma"} · nível {p.xp.nivel}
                    {p.sequencia.ultimo_dia_ativo ? ` · último dia ativo: ${formatLocalDate(p.sequencia.ultimo_dia_ativo)}` : ""}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Numero rotulo="Pontos (XP)" valor={p.xp.xp} detalhe={p.xp.xp_para_proximo === null ? "último nível" : `${p.xp.xp_no_nivel} de ${p.xp.xp_para_proximo} para o nível ${p.xp.nivel + 1}`} />
              <Numero rotulo="Sequência de dias" valor={p.sequencia.atual} detalhe={`maior: ${p.sequencia.maior}`} />
              <Numero rotulo="Uso nos últimos 30 dias" valor={`${p.uso.minutos_30d} min`} detalhe={`${p.uso.dias_ativos_30d} ${p.uso.dias_ativos_30d === 1 ? "dia ativo" : "dias ativos"}`} />
              <Numero rotulo="Medalhas" valor={`${p.medalhas.desbloqueadas}/${p.medalhas.total}`} />
            </CardContent>
          </Card>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Orbit className="size-4" aria-hidden />
                  Missões por planeta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {p.missoes.por_disciplina.map((d) => {
                    const pct = d.publicadas > 0 ? Math.round((d.concluidas / d.publicadas) * 100) : 0;

                    return (
                      <li key={d.chave} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-semibold">
                            <span className="flex size-6 items-center justify-center rounded-full text-slate-950" style={{ backgroundColor: d.cor }}>
                              {createElement(iconePorNome(d.icone), { className: "size-3.5" })}
                            </span>
                            {d.nome}
                          </span>
                          <span className="text-muted-foreground">
                            {d.concluidas} de {d.publicadas} concluídas{d.em_andamento > 0 ? ` · ${d.em_andamento} em andamento` : ""}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.nome}: ${pct}%`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.cor }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="size-4" aria-hidden />
                  Revisão e respostas
                </CardTitle>
                <CardDescription>Itens da revisão espaçada e respostas nas atividades avaliadas.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Numero rotulo="Itens na revisão" valor={p.revisao.itens} detalhe={`${p.revisao.dominados} dominados · ${p.revisao.devidos} para hoje`} />
                <Numero rotulo="Revisões" valor={p.revisao.acertos + p.revisao.erros} detalhe={`${p.revisao.acertos} acertos`} />
                <Numero rotulo="Itens respondidos" valor={p.respostas.itens} detalhe={`${p.respostas.acertou} resolvidos · ${p.respostas.acertou_na_primeira} de primeira`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="size-4" aria-hidden />
                  Com os amigos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Numero rotulo="Mini-aulas dadas" valor={p.mini_aulas.dadas} detalhe={`${p.mini_aulas.aprovadas} aprovadas`} />
                <Numero rotulo="Mini-aulas recebidas" valor={p.mini_aulas.recebidas} detalhe={`${p.mini_aulas.respondidas} respondidas`} />
                <Numero rotulo="Rodas" valor={p.rodas.participou} detalhe="participou" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="size-4" aria-hidden />
                  Teia de Palavras ({p.teia.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {p.teia.ultimas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma palavra ainda.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {p.teia.ultimas.map((w) => (
                      <li key={w.palavra}>
                        <Badge variant={w.origem === "dupla" ? "info" : "secondary"} title={w.descoberta_em ? formatDateTime(w.descoberta_em) : undefined}>
                          {w.palavra}
                          {w.origem === "dupla" ? " · em dupla" : ""}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-4" aria-hidden />
                  Últimas missões
                </CardTitle>
              </CardHeader>
              <CardContent>
                {p.missoes.ultimas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma missão começada.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {p.missoes.ultimas.map((m) => (
                      <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>
                          <strong>{m.rotulo}</strong> · {DISCIPLINAS[m.disciplina] ?? m.disciplina}
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {m.status === "concluida" ? (
                            <Badge variant="success">concluída {m.concluida_em ? formatLocalDate(m.concluida_em) : ""}</Badge>
                          ) : (
                            <Badge variant="warning">
                              etapa {Math.min(m.etapa_atual, m.total_atividades)} de {m.total_atividades}
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="size-4" aria-hidden />
                  Últimas medalhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {p.medalhas.ultimas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma medalha ainda.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {p.medalhas.ultimas.map((m) => (
                      <li key={m.chave} className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          {createElement(iconePorNome(m.icone), { className: "size-4" })}
                        </span>
                        <span className="min-w-0">
                          <span className="font-semibold">{m.titulo}</span>
                          <span className="text-muted-foreground"> {m.descricao}</span>
                        </span>
                        {m.desbloqueada_em ? <span className="ml-auto text-xs text-muted-foreground">{formatLocalDate(m.desbloqueada_em)}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5" aria-hidden />
            Estes números são só da criança com ela mesma: o app nunca mostra nota, ranking ou comparação.
          </p>
        </div>
      ) : null}
    </div>
  );
}
