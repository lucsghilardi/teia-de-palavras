"use client";

import { CheckCircle2, Circle, Eye, EyeOff, Save, TriangleAlert } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Aula } from "@/types/Aula";

type ItemChecklist = { rotulo: string; ok: boolean; detalhe: string };

/** Requisitos do backend para publicar (docs/api-painel.md). */
export function requisitosPublicacao(aula: Aula): ItemChecklist[] {
  return [
    {
      rotulo: "Pelo menos 1 sílaba",
      ok: aula.silabas.length > 0,
      detalhe: `${aula.silabas.length} cadastrada(s)`,
    },
    {
      rotulo: "Pelo menos 1 página de história",
      ok: aula.historia_paginas.length > 0,
      detalhe: `${aula.historia_paginas.length} cadastrada(s)`,
    },
    {
      rotulo: "Pelo menos 1 palavra no dicionário da aula",
      ok: aula.palavras.length > 0,
      detalhe: `${aula.palavras.length} cadastrada(s)`,
    },
  ];
}

function recomendacoes(aula: Aula): ItemChecklist[] {
  const paginasSemImagem = aula.historia_paginas.filter((pagina) => !pagina.imagem_url).length;

  return [
    {
      rotulo: "Imagem da palavra geradora",
      ok: Boolean(aula.palavra_imagem_url),
      detalhe: aula.palavra_imagem_url ? "Enviada" : "Ajuda a criança a reconhecer a palavra",
    },
    {
      rotulo: "Áudio da palavra geradora",
      ok: Boolean(aula.palavra_audio_url),
      detalhe: aula.palavra_audio_url ? "Enviado" : "Sem áudio, o app usa a voz do navegador",
    },
    {
      rotulo: "Imagens em todas as páginas",
      ok: aula.historia_paginas.length > 0 && paginasSemImagem === 0,
      detalhe:
        paginasSemImagem > 0 ? `${paginasSemImagem} página(s) sem imagem` : "Tudo certo",
    },
    {
      rotulo: "Perguntas para a conversa",
      ok: aula.perguntas.length > 0,
      detalhe: `${aula.perguntas.length} pergunta(s)`,
    },
  ];
}

function Checklist({ itens, obrigatorio }: { itens: ItemChecklist[]; obrigatorio: boolean }) {
  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
          {item.ok ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : obrigatorio ? (
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          ) : (
            <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className={cn("text-sm font-medium", !item.ok && obrigatorio && "text-amber-800")}>
              {item.rotulo}
              <span className="sr-only">{item.ok ? " — ok" : " — pendente"}</span>
            </p>
            <p className="text-xs text-muted-foreground">{item.detalhe}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type AbaRevisaoProps = {
  aula: Aula;
  alterado: boolean;
  salvando: boolean;
  alterandoStatus: boolean;
  pendencias: string[];
  onSalvar: () => void;
  onPublicar: () => void;
  onDespublicar: () => void;
};

export function AbaRevisao({
  aula,
  alterado,
  salvando,
  alterandoStatus,
  pendencias,
  onSalvar,
  onPublicar,
  onDespublicar,
}: AbaRevisaoProps) {
  const requisitos = requisitosPublicacao(aula);
  const prontaParaPublicar = requisitos.every((item) => item.ok);
  const publicada = aula.status === "publicada";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Para publicar</CardTitle>
            <CardDescription>
              Verificado na versão salva da aula.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Checklist itens={requisitos} obrigatorio />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendado</CardTitle>
            <CardDescription>Não impede a publicação, mas deixa a aula mais rica.</CardDescription>
          </CardHeader>
          <CardContent>
            <Checklist itens={recomendacoes(aula)} obrigatorio={false} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Situação
            <Badge variant={publicada ? "success" : "muted"}>
              {publicada ? "Publicada" : "Rascunho"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {publicada
              ? "Visível para as crianças (respeitando o pré-requisito)."
              : "Só educadores veem esta aula."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alterado ? (
            <Alert variant="warning" role="status">
              <TriangleAlert />
              <AlertTitle>Alterações não salvas</AlertTitle>
              <AlertDescription>
                <p>Salve antes de {publicada ? "despublicar" : "publicar"}.</p>
                <Button type="button" size="sm" onClick={onSalvar} disabled={salvando}>
                  {salvando ? <Spinner /> : <Save />}
                  Salvar agora
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {pendencias.length > 0 ? (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>Não foi possível publicar</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 list-disc space-y-1">
                  {pendencias.map((pendencia) => (
                    <li key={pendencia}>{pendencia}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {publicada ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onDespublicar}
              disabled={alterandoStatus || alterado}
            >
              {alterandoStatus ? <Spinner /> : <EyeOff />}
              Despublicar (voltar para rascunho)
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={onPublicar}
              disabled={alterandoStatus || alterado || !prontaParaPublicar}
            >
              {alterandoStatus ? <Spinner /> : <Eye />}
              Publicar aula
            </Button>
          )}

          {!publicada && !prontaParaPublicar ? (
            <p className="text-xs text-muted-foreground">
              Complete os itens de “Para publicar” e salve.
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Última atualização: {formatDateTime(aula.updated_at)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
