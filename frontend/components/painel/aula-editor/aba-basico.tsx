"use client";

import { CaixaAltaInput } from "@/components/painel/caixa-alta-input";
import { MidiaField } from "@/components/painel/midia-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
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
import { formatDateTime } from "@/lib/format";
import { caixaAlta } from "@/lib/silabas";
import type { Aula, AulaResumo } from "@/types/Aula";

import type { AulaRascunho } from "./rascunho";
import type { MidiaHandlers } from "./tipos";

const SEM_PRE_REQUISITO = "nenhum";
const FASES = [1, 2];

type AbaBasicoProps = {
  aula: Aula;
  rascunho: AulaRascunho;
  outrasAulas: AulaResumo[];
  onChange: (patch: Partial<AulaRascunho>) => void;
  midia: MidiaHandlers;
};

export function AbaBasico({ aula, rascunho, outrasAulas, onChange, midia }: AbaBasicoProps) {
  const fases = FASES.includes(rascunho.fase) ? FASES : [...FASES, rascunho.fase];
  const preRequisitoValor =
    rascunho.pre_requisito_aula_id === null
      ? SEM_PRE_REQUISITO
      : String(rascunho.pre_requisito_aula_id);
  const preRequisitoConhecido =
    rascunho.pre_requisito_aula_id === null ||
    outrasAulas.some((item) => item.id === rascunho.pre_requisito_aula_id);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <Card>
        <CardHeader>
          <CardTitle>Dados da aula</CardTitle>
          <CardDescription>
            A palavra geradora é o ponto de partida: dela saem as sílabas e as
            famílias que a criança vai explorar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="aula-palavra">Palavra geradora</FieldLabel>
              <CaixaAltaInput
                id="aula-palavra"
                value={rascunho.palavra_geradora}
                onValueChange={(valor) =>
                  onChange({ palavra_geradora: valor })
                }
                autoComplete="off"
                className="h-14 text-3xl font-extrabold tracking-wider md:text-3xl"
                required
              />
              <FieldDescription>
                Mudou a palavra? Revise as sílabas na aba “Sílabas e famílias”.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="aula-titulo">Título</FieldLabel>
              <Input
                id="aula-titulo"
                value={rascunho.titulo}
                onChange={(event) => onChange({ titulo: event.target.value })}
                required
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="aula-fase">Fase</FieldLabel>
                <Select
                  value={String(rascunho.fase)}
                  onValueChange={(valor) => onChange({ fase: Number(valor) })}
                >
                  <SelectTrigger id="aula-fase" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fases.map((fase) => (
                      <SelectItem key={fase} value={String(fase)}>
                        Fase {fase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="aula-pre-requisito">Pré-requisito</FieldLabel>
                <Select
                  value={preRequisitoValor}
                  onValueChange={(valor) =>
                    onChange({
                      pre_requisito_aula_id:
                        valor === SEM_PRE_REQUISITO ? null : Number(valor),
                    })
                  }
                >
                  <SelectTrigger id="aula-pre-requisito" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_PRE_REQUISITO}>Nenhum (liberada ao publicar)</SelectItem>
                    {outrasAulas.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        Fase {item.fase} · {item.ordem}. {caixaAlta(item.palavra_geradora)} —{" "}
                        {item.titulo}
                      </SelectItem>
                    ))}
                    {preRequisitoConhecido ? null : (
                      <SelectItem value={preRequisitoValor}>
                        Aula #{rascunho.pre_requisito_aula_id}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  A aula só é liberada depois que a criança concluir a escolhida.
                </FieldDescription>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Imagem e áudio da palavra</CardTitle>
            <CardDescription>
              Enviados na hora, sem precisar salvar. Sem áudio, o app usa a voz
              do navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MidiaField
              tipo="imagem"
              label="Imagem da palavra"
              url={aula.palavra_imagem_url}
              onUpload={(arquivo) => midia.enviar("palavra_imagem", undefined, arquivo)}
              onRemove={() => midia.remover("palavra_imagem", undefined)}
            />
            <MidiaField
              tipo="audio"
              label="Áudio da palavra"
              url={aula.palavra_audio_url}
              onUpload={(arquivo) => midia.enviar("palavra_audio", undefined, arquivo)}
              onRemove={() => midia.remover("palavra_audio", undefined)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Endereço</dt>
              <dd className="font-mono break-all">{aula.slug}</dd>
              <dt className="text-muted-foreground">Ordem</dt>
              <dd>
                Fase {aula.fase}, posição {aula.ordem}
              </dd>
              <dt className="text-muted-foreground">Criada por</dt>
              <dd>{aula.criada_por?.name ?? "—"}</dd>
              <dt className="text-muted-foreground">Atualizada</dt>
              <dd>{formatDateTime(aula.updated_at)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
