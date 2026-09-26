"use client";

import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { CaixaAltaInput } from "@/components/painel/caixa-alta-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { mensagemDeErro } from "@/lib/api-errors";
import { caixaAlta, normalizarPalavra } from "@/lib/silabas";
import { appToast } from "@/lib/toast";
import { sugerirFamilia } from "@/services/painel";

import { ItemToolbar } from "./item-toolbar";
import { moverItem, novaChave, type SilabaRascunho } from "./rascunho";

type SilabaCardProps = {
  silaba: SilabaRascunho;
  indice: number;
  total: number;
  onAlterar: (patch: Partial<SilabaRascunho>) => void;
  onMover: (delta: -1 | 1) => void;
  onRemover: () => void;
};

function SilabaCard({ silaba, indice, total, onAlterar, onMover, onRemover }: SilabaCardProps) {
  const [novaLetra, setNovaLetra] = useState("");
  const [sugerindo, setSugerindo] = useState(false);
  const inputId = `silaba-${silaba.chave}`;
  const nome = silaba.texto.trim() || `sílaba ${indice + 1}`;

  function adicionarNaFamilia() {
    const novas = novaLetra
      .split(/[\s,;]+/)
      .map((parte) => caixaAlta(parte.trim()))
      .filter(Boolean);

    if (novas.length === 0) {
      return;
    }

    const familia = [...silaba.familia];

    novas.forEach((item) => {
      if (!familia.includes(item)) familia.push(item);
    });

    onAlterar({ familia });
    setNovaLetra("");
  }

  async function sugerir() {
    const texto = silaba.texto.trim();

    if (!texto) {
      appToast.warning("Escreva a sílaba antes de pedir a sugestão.");
      return;
    }

    setSugerindo(true);

    try {
      const { familia } = await sugerirFamilia(caixaAlta(texto));

      onAlterar({ familia: Array.from(new Set(familia.map(caixaAlta))) });

      if (familia.length === 0) {
        appToast.info(`Sem família sugerida para ${texto}.`);
      }
    } catch (error) {
      appToast.error(mensagemDeErro(error, "Não foi possível sugerir a família."));
    } finally {
      setSugerindo(false);
    }
  }

  return (
    <li className="space-y-4 rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor={inputId} className="text-xs font-semibold text-muted-foreground">
            Sílaba {indice + 1}
          </label>
          <CaixaAltaInput
            id={inputId}
            value={silaba.texto}
            onValueChange={(valor) => onAlterar({ texto: valor })}
            className="h-12 w-28 text-center text-2xl font-extrabold tracking-wider md:text-2xl"
            autoComplete="off"
            maxLength={8}
            aria-invalid={!silaba.texto.trim() || undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={sugerir}
          disabled={sugerindo}
          aria-label={`Sugerir família da ${nome}`}
        >
          {sugerindo ? <Spinner /> : <Sparkles />}
          Sugerir família
        </Button>
        <div className="ml-auto">
          <ItemToolbar
            rotulo={nome}
            indice={indice}
            total={total}
            onMover={onMover}
            onRemover={onRemover}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p id={`${inputId}-familia`} className="text-xs font-semibold text-muted-foreground">
          Família
        </p>
        {silaba.familia.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem família (ex.: vogal sozinha). Use “Sugerir família” ou adicione abaixo.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-labelledby={`${inputId}-familia`}>
            {silaba.familia.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 py-1 pr-1 pl-3 text-lg font-bold tracking-wide text-primary"
              >
                {item}
                <button
                  type="button"
                  onClick={() =>
                    onAlterar({ familia: silaba.familia.filter((atual) => atual !== item) })
                  }
                  className="flex size-6 items-center justify-center rounded-full text-primary/70 outline-none hover:bg-primary/10 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Remover ${item} da família de ${nome}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex max-w-sm gap-2">
          <CaixaAltaInput
            value={novaLetra}
            onValueChange={(valor) => setNovaLetra(valor)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                adicionarNaFamilia();
              }
            }}
            placeholder="Ex.: TA TE TI"
            autoComplete="off"
            aria-label={`Adicionar à família de ${nome}`}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={adicionarNaFamilia}
            disabled={!novaLetra.trim()}
          >
            <Plus />
            Adicionar
          </Button>
        </div>
      </div>
    </li>
  );
}

type AbaSilabasProps = {
  silabas: SilabaRascunho[];
  palavraGeradora: string;
  onChange: (silabas: SilabaRascunho[]) => void;
};

export function AbaSilabas({ silabas, palavraGeradora, onChange }: AbaSilabasProps) {
  const juntas = silabas.map((silaba) => silaba.texto.trim()).join("");
  const naoBate =
    silabas.length > 0 &&
    palavraGeradora.trim() !== "" &&
    normalizarPalavra(juntas) !== normalizarPalavra(palavraGeradora);

  function alterar(indice: number, patch: Partial<SilabaRascunho>) {
    onChange(silabas.map((silaba, i) => (i === indice ? { ...silaba, ...patch } : silaba)));
  }

  return (
    <div className="space-y-4">
      <Alert variant="info" role="note">
        <Sparkles />
        <AlertTitle>Sílabas geram famílias</AlertTitle>
        <AlertDescription>
          <p>
            Cada sílaba da palavra geradora abre uma família (TE → TA TE TI TO TU).
            As famílias se acumulam de uma aula para a outra.
          </p>
        </AlertDescription>
      </Alert>

      {naoBate ? (
        <Alert variant="warning" role="status">
          <AlertTitle>As sílabas não formam a palavra geradora</AlertTitle>
          <AlertDescription>
            <p>
              Juntas elas formam <strong>{juntas || "—"}</strong>, mas a palavra é{" "}
              <strong>{palavraGeradora}</strong>.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {silabas.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma sílaba. Para publicar, a aula precisa de pelo menos uma.
        </p>
      ) : (
        <ol className="space-y-3" aria-label="Sílabas da palavra geradora">
          {silabas.map((silaba, indice) => (
            <SilabaCard
              key={silaba.chave}
              silaba={silaba}
              indice={indice}
              total={silabas.length}
              onAlterar={(patch) => alterar(indice, patch)}
              onMover={(delta) => onChange(moverItem(silabas, indice, delta))}
              onRemover={() => onChange(silabas.filter((_, i) => i !== indice))}
            />
          ))}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([...silabas, { chave: novaChave("silaba"), texto: "", familia: [] }])
        }
      >
        <Plus />
        Adicionar sílaba
      </Button>
    </div>
  );
}
