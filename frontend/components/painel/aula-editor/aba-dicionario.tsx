"use client";

import { BookA, Plus } from "lucide-react";

import { CaixaAltaInput } from "@/components/painel/caixa-alta-input";
import { MidiaField } from "@/components/painel/midia-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { separarSilabas, silabasFormamPalavra } from "@/lib/silabas";

import { ItemToolbar } from "./item-toolbar";
import { novaChave, type PalavraRascunho } from "./rascunho";
import { DICA_SALVAR_PARA_MIDIA, type MidiaHandlers } from "./tipos";

type AbaDicionarioProps = {
  palavras: PalavraRascunho[];
  onChange: (palavras: PalavraRascunho[]) => void;
  midia: MidiaHandlers;
};

export function AbaDicionario({ palavras, onChange, midia }: AbaDicionarioProps) {
  function alterar(indice: number, patch: Partial<PalavraRascunho>) {
    onChange(palavras.map((palavra, i) => (i === indice ? { ...palavra, ...patch } : palavra)));
  }

  return (
    <div className="space-y-4">
      <Alert variant="info" role="note">
        <BookA />
        <AlertTitle>Palavras que a criança pode formar</AlertTitle>
        <AlertDescription>
          <p>
            Separe as sílabas com hífen (TA-TU). Se deixar em branco, o sistema
            separa sozinho ao salvar. Marque “Destaque” nas palavras principais da aula.
          </p>
        </AlertDescription>
      </Alert>

      {palavras.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma palavra. Para publicar, a aula precisa de pelo menos uma.
        </p>
      ) : (
        <ul className="space-y-4" aria-label="Palavras do dicionário da aula">
          {palavras.map((palavra, indice) => {
            const nome = palavra.palavra.trim() || `palavra ${indice + 1}`;
            const semId = palavra.id === undefined;
            const silabas = separarSilabas(palavra.silabas);
            const silabasNaoBatem =
              silabas.length > 0 &&
              palavra.palavra.trim() !== "" &&
              !silabasFormamPalavra(palavra.palavra, silabas);
            const idBase = `palavra-${palavra.chave}`;

            return (
              <li key={palavra.chave} className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1 space-y-1.5">
                    <label htmlFor={`${idBase}-texto`} className="text-xs font-semibold text-muted-foreground">
                      Palavra
                    </label>
                    <CaixaAltaInput
                      id={`${idBase}-texto`}
                      value={palavra.palavra}
                      onValueChange={(valor) => alterar(indice, { palavra: valor })}
                      className="h-11 text-xl font-extrabold tracking-wide md:text-xl"
                      autoComplete="off"
                      aria-invalid={!palavra.palavra.trim() || undefined}
                    />
                  </div>
                  <div className="min-w-40 flex-1 space-y-1.5">
                    <label htmlFor={`${idBase}-silabas`} className="text-xs font-semibold text-muted-foreground">
                      Sílabas
                    </label>
                    <CaixaAltaInput
                      id={`${idBase}-silabas`}
                      value={palavra.silabas}
                      onValueChange={(valor) => alterar(indice, { silabas: valor })}
                      className="h-11 font-mono text-lg tracking-wide"
                      placeholder="TA-TU (ou em branco)"
                      autoComplete="off"
                      aria-invalid={silabasNaoBatem || undefined}
                      aria-describedby={silabasNaoBatem ? `${idBase}-aviso` : undefined}
                    />
                  </div>
                  <div className="flex h-11 items-center gap-2">
                    <Switch
                      id={`${idBase}-destaque`}
                      checked={palavra.destaque}
                      onCheckedChange={(checked) => alterar(indice, { destaque: checked })}
                    />
                    <label htmlFor={`${idBase}-destaque`} className="text-sm font-medium">
                      Destaque
                    </label>
                  </div>
                  <div className="flex h-11 items-center">
                    <ItemToolbar
                      rotulo={nome}
                      indice={indice}
                      total={palavras.length}
                      onRemover={() => onChange(palavras.filter((_, i) => i !== indice))}
                    />
                  </div>
                </div>

                {silabasNaoBatem ? (
                  <p id={`${idBase}-aviso`} className="text-sm text-amber-700">
                    Juntas, as sílabas formam “{silabas.join("")}”, não “{palavra.palavra.trim()}”.
                  </p>
                ) : null}
                {semId ? (
                  <p className="text-xs text-muted-foreground">Palavra nova, ainda não salva.</p>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <MidiaField
                    tipo="imagem"
                    label={`Imagem de ${nome}`}
                    url={palavra.imagem_url}
                    disabled={semId}
                    disabledHint={DICA_SALVAR_PARA_MIDIA}
                    onUpload={(arquivo) =>
                      midia.enviar("palavra_dicionario_imagem", palavra.id, arquivo)
                    }
                    onRemove={() => midia.remover("palavra_dicionario_imagem", palavra.id)}
                  />
                  <MidiaField
                    tipo="audio"
                    label={`Áudio de ${nome}`}
                    url={palavra.audio_url}
                    disabled={semId}
                    disabledHint={DICA_SALVAR_PARA_MIDIA}
                    onUpload={(arquivo) =>
                      midia.enviar("palavra_dicionario_audio", palavra.id, arquivo)
                    }
                    onRemove={() => midia.remover("palavra_dicionario_audio", palavra.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...palavras,
            {
              chave: novaChave("palavra"),
              palavra: "",
              silabas: "",
              destaque: false,
              imagem_url: null,
              audio_url: null,
            },
          ])
        }
      >
        <Plus />
        Adicionar palavra
      </Button>
    </div>
  );
}
