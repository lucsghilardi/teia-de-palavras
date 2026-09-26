"use client";

import { ListChecks, Plus, Wand2 } from "lucide-react";
import { useState } from "react";

import { MidiaField } from "@/components/painel/midia-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Disciplina } from "@/types/CriancaApp";

import { ItemToolbar } from "./item-toolbar";
import { modeloDoTipo, modelosPara, nomeDoTipo } from "./modelos-atividade";
import { configDoTexto, configParaTexto, moverItem, novaChave, type AtividadeRascunho } from "./rascunho";
import { DICA_SALVAR_PARA_MIDIA, type MidiaHandlers } from "./tipos";

type AbaAtividadesProps = {
  atividades: AtividadeRascunho[];
  disciplina: Disciplina;
  onChange: (atividades: AtividadeRascunho[]) => void;
  midia: MidiaHandlers;
};

/**
 * A sequência de atividades da missão: tipo, título, instrução falada,
 * config em JSON (com um modelo por tipo) e imagem. A ordem da lista é a
 * ordem da missão; a conquista vem sozinha no fim.
 */
export function AbaAtividades({ atividades, disciplina, onChange, midia }: AbaAtividadesProps) {
  const modelos = modelosPara(disciplina);
  const [tipoNovo, setTipoNovo] = useState<string>(modelos[0]?.tipo ?? "escolha");

  function alterar(indice: number, patch: Partial<AtividadeRascunho>) {
    onChange(atividades.map((a, i) => (i === indice ? { ...a, ...patch } : a)));
  }

  function adicionar() {
    const modelo = modeloDoTipo(tipoNovo);

    onChange([
      ...atividades,
      {
        chave: novaChave("atividade"),
        tipo: tipoNovo,
        titulo: "",
        instrucao: "",
        config: configParaTexto(modelo?.modelo ?? {}),
        imagem_url: null,
        avaliada: modelo?.avaliada ?? false,
      },
    ]);
  }

  function usarModelo(indice: number) {
    const modelo = modeloDoTipo(atividades[indice].tipo);

    if (!modelo) return;

    const atual = configDoTexto(atividades[indice].config);
    const vazio = atual !== null && Object.keys(atual).length === 0;

    if (!vazio && !window.confirm("Substituir o JSON atual pelo modelo do tipo?")) return;

    alterar(indice, { config: configParaTexto(modelo.modelo) });
  }

  return (
    <div className="space-y-4">
      <Alert variant="info" role="note">
        <ListChecks />
        <AlertTitle>Como montar a missão</AlertTitle>
        <AlertDescription>
          <p>
            Cada atividade tem um tipo e um <code className="rounded bg-sky-100 px-1 font-mono">config</code> em
            JSON (formato em <code className="rounded bg-sky-100 px-1 font-mono">docs/atividades.md</code>). Use
            “Modelo” para começar. A instrução é o que o alto-falante fala; o título aparece na trilha. Missões
            curtas funcionam melhor: 3 a 7 atividades.
          </p>
        </AlertDescription>
      </Alert>

      {atividades.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma atividade. Para publicar, a missão precisa de pelo menos uma.
        </p>
      ) : (
        <ol className="space-y-4" aria-label="Atividades da missão">
          {atividades.map((atividade, indice) => {
            const rotulo = `atividade ${indice + 1}`;
            const semId = atividade.id === undefined;
            const modelo = modeloDoTipo(atividade.tipo);
            const jsonValido = configDoTexto(atividade.config) !== null;

            return (
              <li key={atividade.chave} className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary tabular-nums">
                      {indice + 1}
                    </span>
                    <span className="text-sm font-semibold">{nomeDoTipo(atividade.tipo)}</span>
                    <Badge variant={modelo?.avaliada ? "success" : "muted"}>
                      {modelo?.avaliada ? "Avaliada" : "Só leitura"}
                    </Badge>
                    {semId ? (
                      <span className="text-xs text-muted-foreground">(nova, ainda não salva)</span>
                    ) : null}
                  </div>
                  <ItemToolbar
                    rotulo={rotulo}
                    indice={indice}
                    total={atividades.length}
                    onMover={(delta) => onChange(moverItem(atividades, indice, delta))}
                    onRemover={() => onChange(atividades.filter((_, i) => i !== indice))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor={`tipo-${atividade.chave}`}>Tipo</FieldLabel>
                    <Select
                      value={atividade.tipo}
                      onValueChange={(tipo) => {
                        const novo = modeloDoTipo(tipo);

                        alterar(indice, { tipo, avaliada: novo?.avaliada ?? false });
                      }}
                    >
                      <SelectTrigger id={`tipo-${atividade.chave}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelos.map((m) => (
                          <SelectItem key={m.tipo} value={m.tipo}>
                            {m.nome}
                          </SelectItem>
                        ))}
                        {modelos.some((m) => m.tipo === atividade.tipo) ? null : (
                          <SelectItem value={atividade.tipo}>{atividade.tipo}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {modelo ? <FieldDescription>{modelo.descricao}</FieldDescription> : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`titulo-${atividade.chave}`}>Título (trilha)</FieldLabel>
                    <Input
                      id={`titulo-${atividade.chave}`}
                      value={atividade.titulo}
                      maxLength={80}
                      placeholder="Ex.: Contar os suprimentos"
                      onChange={(event) => alterar(indice, { titulo: event.target.value })}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`instrucao-${atividade.chave}`}>Instrução (falada)</FieldLabel>
                    <Input
                      id={`instrucao-${atividade.chave}`}
                      value={atividade.instrucao}
                      maxLength={200}
                      placeholder="Ex.: Conte e toque no número certo."
                      onChange={(event) => alterar(indice, { instrucao: event.target.value })}
                    />
                  </Field>
                </div>

                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={`config-${atividade.chave}`}>Config (JSON)</FieldLabel>
                    <Button type="button" size="sm" variant="ghost" onClick={() => usarModelo(indice)} disabled={!modelo}>
                      <Wand2 />
                      Modelo
                    </Button>
                  </div>
                  <Textarea
                    id={`config-${atividade.chave}`}
                    value={atividade.config}
                    onChange={(event) => alterar(indice, { config: event.target.value })}
                    rows={8}
                    spellCheck={false}
                    aria-invalid={!jsonValido}
                    className={cn("min-h-32 font-mono text-sm", !jsonValido && "border-destructive")}
                  />
                  <FieldDescription className={cn(!jsonValido && "text-destructive")}>
                    {jsonValido ? "O backend valida o conteúdo ao salvar." : "JSON inválido: precisa ser um objeto { … }."}
                  </FieldDescription>
                </Field>

                <MidiaField
                  tipo="imagem"
                  label={`Imagem da ${rotulo}`}
                  url={atividade.imagem_url}
                  disabled={semId}
                  disabledHint={DICA_SALVAR_PARA_MIDIA}
                  onUpload={(arquivo) => midia.enviar("atividade_imagem", atividade.id, arquivo)}
                  onRemove={() => midia.remover("atividade_imagem", atividade.id)}
                  className="md:max-w-md"
                />
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-64">
          <FieldLabel htmlFor="tipo-nova-atividade">Tipo da nova atividade</FieldLabel>
          <Select value={tipoNovo} onValueChange={setTipoNovo}>
            <SelectTrigger id="tipo-nova-atividade" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelos.map((m) => (
                <SelectItem key={m.tipo} value={m.tipo}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button type="button" variant="outline" onClick={adicionar}>
          <Plus />
          Adicionar atividade
        </Button>
      </div>
    </div>
  );
}
