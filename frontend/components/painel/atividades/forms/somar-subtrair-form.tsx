"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BotaoAdicionar, BotaoRemover, Campo, lista, numero, semItem, texto, trocarItem, type Config, type FormProps } from "./comuns";

/** Formulário de `somar_subtrair`: fatos fixos ou gerados, apoio e nº de opções. */
export function SomarSubtrairForm({ config, onChange }: FormProps) {
  const gerar = (config.gerar ?? null) as Config | null;
  const itens = lista(config.itens);
  const modo = gerar ? "gerar" : "itens";
  const operacoes = lista<string>(gerar?.operacoes).map((o) => texto(o));

  const definirModo = (novo: string) => {
    if (novo === "gerar") {
      onChange({ ...config, itens: [], gerar: { quantidade: 4, maximo: 20, operacoes: ["+"] } });
    } else {
      onChange({ ...config, gerar: null, itens: itens.length > 0 ? itens : [{ a: 7, b: 5, operacao: "+" }] });
    }
  };

  const alternarOperacao = (op: string, ligada: boolean) => {
    const novas = ligada ? [...new Set([...operacoes, op])] : operacoes.filter((o) => o !== op);
    onChange({ ...config, gerar: { ...(gerar ?? {}), operacoes: novas.length > 0 ? novas : [op] } });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Fatos</span>
          <Select value={modo} onValueChange={definirModo}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gerar">Gerados (estáveis por criança)</SelectItem>
              <SelectItem value="itens">Fixos (eu escolho)</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Apoio (CPA)</span>
          <Select value={texto(config.apoio, "icones")} onValueChange={(v) => onChange({ ...config, apoio: v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="icones">Ícones (concreto)</SelectItem>
              <SelectItem value="reta">Reta numérica (pictórico)</SelectItem>
              <SelectItem value="nenhum">Só símbolos (abstrato)</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Campo rotulo="Opções por fato (2 a 5)" tipo="number" min={2} max={5} valor={numero(config.opcoes, 3)} onChange={(v) => onChange({ ...config, opcoes: numero(v, 3) })} />
      </div>

      {gerar ? (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
          <Campo rotulo="Quantos fatos" tipo="number" min={1} max={12} valor={numero(gerar.quantidade, 4)} onChange={(v) => onChange({ ...config, gerar: { ...gerar, quantidade: numero(v, 4) } })} />
          <Campo rotulo="Resultado máximo" tipo="number" min={2} max={100} valor={numero(gerar.maximo, 20)} onChange={(v) => onChange({ ...config, gerar: { ...gerar, maximo: numero(v, 20) } })} />
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Operações</span>
            <div className="flex items-center gap-4 pt-2">
              {["+", "-"].map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={operacoes.includes(op)} onCheckedChange={(v) => alternarOperacao(op, v === true)} />
                  {op === "+" ? "Somar" : "Subtrair"}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          {itens.map((item, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <Campo rotulo="a" tipo="number" min={0} max={100} valor={numero(item.a)} onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { a: numero(v) }) })} className="w-24" />
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">op.</span>
                <Select value={texto(item.operacao, "+")} onValueChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { operacao: v }) })}>
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="-">−</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <Campo rotulo="b" tipo="number" min={0} max={100} valor={numero(item.b)} onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { b: numero(v) }) })} className="w-24" />
              <BotaoRemover rotulo={`Remover fato ${i + 1}`} disabled={itens.length <= 1} onClick={() => onChange({ ...config, itens: semItem(itens, i) })} />
            </div>
          ))}
          <BotaoAdicionar rotulo="Fato" disabled={itens.length >= 12} onClick={() => onChange({ ...config, itens: [...itens, { a: 0, b: 0, operacao: "+" }] })} />
        </div>
      )}
    </div>
  );
}
