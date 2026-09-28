"use client";

import { BookOpen, Plus } from "lucide-react";

import { MidiaField } from "@/components/painel/midia-field";
import { SeletorIlustracao } from "@/components/painel/seletor-ilustracao";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Configuracoes } from "@/types/Configuracoes";

import { ItemToolbar } from "./item-toolbar";
import { moverItem, novaChave, type PaginaRascunho } from "./rascunho";
import { DICA_SALVAR_PARA_MIDIA, type MidiaHandlers } from "./tipos";

type AbaHistoriaProps = {
  paginas: PaginaRascunho[];
  onChange: (paginas: PaginaRascunho[]) => void;
  midia: MidiaHandlers;
  configuracoes: Configuracoes | null;
};

export function AbaHistoria({ paginas, onChange, midia, configuracoes }: AbaHistoriaProps) {
  function alterar(indice: number, patch: Partial<PaginaRascunho>) {
    onChange(paginas.map((pagina, i) => (i === indice ? { ...pagina, ...patch } : pagina)));
  }

  return (
    <div className="space-y-4">
      <Alert variant="info" role="note">
        <BookOpen />
        <AlertTitle>Personagens da história</AlertTitle>
        <AlertDescription>
          <p>
            Escreva <code className="rounded bg-sky-100 px-1 font-mono">{"{{heroi}}"}</code>,{" "}
            <code className="rounded bg-sky-100 px-1 font-mono">{"{{fabrica}}"}</code> e{" "}
            <code className="rounded bg-sky-100 px-1 font-mono">{"{{mascote}}"}</code> no texto:
            no app eles viram{" "}
            {configuracoes ? (
              <>
                “<strong>{configuracoes.heroi_nome}</strong>”, “
                <strong>{configuracoes.fabrica_nome}</strong>” e “
                <strong>{configuracoes.mascote_nome}</strong>”
              </>
            ) : (
              "os nomes definidos"
            )}{" "}
            (ajustáveis em Configurações).
          </p>
        </AlertDescription>
      </Alert>

      {paginas.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma página. Para publicar, a aula precisa de pelo menos uma.
        </p>
      ) : (
        <ol className="space-y-4" aria-label="Páginas da história">
          {paginas.map((pagina, indice) => {
            const rotulo = `página ${indice + 1}`;
            const semId = pagina.id === undefined;

            return (
              <li key={pagina.chave} className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`pagina-${pagina.chave}`}
                    className="text-sm font-semibold"
                  >
                    Página {indice + 1}
                    {semId ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (nova, ainda não salva)
                      </span>
                    ) : null}
                  </label>
                  <ItemToolbar
                    rotulo={rotulo}
                    indice={indice}
                    total={paginas.length}
                    onMover={(delta) => onChange(moverItem(paginas, indice, delta))}
                    onRemover={() => onChange(paginas.filter((_, i) => i !== indice))}
                  />
                </div>

                <Textarea
                  id={`pagina-${pagina.chave}`}
                  value={pagina.texto}
                  onChange={(event) => alterar(indice, { texto: event.target.value })}
                  rows={4}
                  className="min-h-24 text-base"
                  placeholder="Era uma vez {{heroi}}..."
                />

                <SeletorIlustracao
                  id={`pagina-ilustracao-${pagina.chave}`}
                  rotulo={`Cena desenhada da ${rotulo}`}
                  valor={pagina.ilustracao}
                  onChange={(ilustracao) => alterar(indice, { ilustracao })}
                  descricao="Uma imagem enviada abaixo vence a cena."
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <MidiaField
                    tipo="imagem"
                    label={`Imagem da ${rotulo}`}
                    url={pagina.imagem_url}
                    disabled={semId}
                    disabledHint={DICA_SALVAR_PARA_MIDIA}
                    onUpload={(arquivo) => midia.enviar("pagina_imagem", pagina.id, arquivo)}
                    onRemove={() => midia.remover("pagina_imagem", pagina.id)}
                  />
                  <MidiaField
                    tipo="audio"
                    label={`Áudio da ${rotulo}`}
                    url={pagina.audio_url}
                    disabled={semId}
                    disabledHint={DICA_SALVAR_PARA_MIDIA}
                    onUpload={(arquivo) => midia.enviar("pagina_audio", pagina.id, arquivo)}
                    onRemove={() => midia.remover("pagina_audio", pagina.id)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...paginas,
            { chave: novaChave("pagina"), texto: "", ilustracao: "", imagem_url: null, audio_url: null },
          ])
        }
      >
        <Plus />
        Adicionar página
      </Button>
    </div>
  );
}
