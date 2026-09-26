"use client";

import { MessagesSquare, Plus } from "lucide-react";

import { MidiaField } from "@/components/painel/midia-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ItemToolbar } from "./item-toolbar";
import { moverItem, novaChave, type PerguntaRascunho } from "./rascunho";
import { DICA_SALVAR_PARA_MIDIA, type MidiaHandlers } from "./tipos";

type AbaConversaProps = {
  perguntas: PerguntaRascunho[];
  onChange: (perguntas: PerguntaRascunho[]) => void;
  midia: MidiaHandlers;
};

export function AbaConversa({ perguntas, onChange, midia }: AbaConversaProps) {
  function alterar(indice: number, patch: Partial<PerguntaRascunho>) {
    onChange(perguntas.map((pergunta, i) => (i === indice ? { ...pergunta, ...patch } : pergunta)));
  }

  return (
    <div className="space-y-4">
      <Alert variant="info" role="note">
        <MessagesSquare />
        <AlertTitle>Roda de conversa</AlertTitle>
        <AlertDescription>
          <p>
            Perguntas que ligam a palavra geradora à vida da criança. Não há
            resposta certa ou errada: a ideia é conversar.
          </p>
        </AlertDescription>
      </Alert>

      {perguntas.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma pergunta ainda.
        </p>
      ) : (
        <ol className="space-y-4" aria-label="Perguntas da conversa">
          {perguntas.map((pergunta, indice) => {
            const rotulo = `pergunta ${indice + 1}`;
            const semId = pergunta.id === undefined;

            return (
              <li
                key={pergunta.chave}
                className="grid gap-4 rounded-xl border bg-card p-4 shadow-xs lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={`pergunta-${pergunta.chave}`}
                      className="text-sm font-semibold"
                    >
                      Pergunta {indice + 1}
                      {semId ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (nova, ainda não salva)
                        </span>
                      ) : null}
                    </label>
                    <ItemToolbar
                      rotulo={rotulo}
                      indice={indice}
                      total={perguntas.length}
                      onMover={(delta) => onChange(moverItem(perguntas, indice, delta))}
                      onRemover={() => onChange(perguntas.filter((_, i) => i !== indice))}
                    />
                  </div>
                  <Textarea
                    id={`pergunta-${pergunta.chave}`}
                    value={pergunta.texto}
                    onChange={(event) => alterar(indice, { texto: event.target.value })}
                    rows={3}
                    className="text-base"
                    placeholder="Ex.: Você já viu um tatu? Onde ele mora?"
                  />
                </div>

                <MidiaField
                  tipo="audio"
                  label={`Áudio da ${rotulo}`}
                  url={pergunta.audio_url}
                  disabled={semId}
                  disabledHint={DICA_SALVAR_PARA_MIDIA}
                  onUpload={(arquivo) => midia.enviar("pergunta_audio", pergunta.id, arquivo)}
                  onRemove={() => midia.remover("pergunta_audio", pergunta.id)}
                />
              </li>
            );
          })}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([...perguntas, { chave: novaChave("pergunta"), texto: "", audio_url: null }])
        }
      >
        <Plus />
        Adicionar pergunta
      </Button>
    </div>
  );
}
