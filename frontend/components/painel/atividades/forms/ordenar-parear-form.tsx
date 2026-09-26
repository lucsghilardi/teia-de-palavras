"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BotaoAdicionar, BotaoRemover, Campo, lista, semItem, texto, trocarItem, type FormProps } from "./comuns";

/** Formulário de `ordenar`/`linha_do_tempo` (a ordem da lista é a certa). */
export function OrdenarForm({ config, onChange }: FormProps) {
  const itens = lista(config.itens);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Enunciado" valor={texto(config.instrucao)} placeholder="do primeiro ao último" onChange={(v) => onChange({ ...config, instrucao: v })} className="sm:col-span-2" />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Modo</span>
          <Select value={texto(config.modo, "sequencia")} onValueChange={(v) => onChange({ ...config, modo: v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sequencia">Sequência</SelectItem>
              <SelectItem value="tempo">Tempo (antes e depois)</SelectItem>
              <SelectItem value="numeros">Números (do menor ao maior)</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        <span className="block text-xs font-semibold text-muted-foreground">Itens na ordem certa</span>
        {itens.map((item, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <span className="pb-2 text-sm font-bold tabular-nums text-muted-foreground">{i + 1}.</span>
            <Campo rotulo="Texto" valor={texto(item.texto)} onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { texto: v }) })} className="min-w-48 flex-1" />
            <Campo rotulo="Ícone" valor={texto(item.icone)} placeholder="sun" onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { icone: v || null }) })} className="w-36" />
            <BotaoRemover rotulo={`Remover item ${i + 1}`} disabled={itens.length <= 2} onClick={() => onChange({ ...config, itens: semItem(itens, i) })} />
          </div>
        ))}
        <BotaoAdicionar rotulo="Item" disabled={itens.length >= 8} onClick={() => onChange({ ...config, itens: [...itens, { texto: "", icone: null }] })} />
      </div>

      <Campo rotulo="Dica (1º erro)" valor={texto(config.dica)} onChange={(v) => onChange({ ...config, dica: v })} />
    </div>
  );
}

/** Formulário de `parear`: pares a ↔ b com ícones opcionais. */
export function ParearForm({ config, onChange }: FormProps) {
  const pares = lista(config.pares);

  return (
    <div className="space-y-3">
      <Campo rotulo="Enunciado" valor={texto(config.instrucao)} placeholder="ligue cada lugar ao que acontece nele" onChange={(v) => onChange({ ...config, instrucao: v })} />

      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        {pares.map((par, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <Campo rotulo="Esquerda (a)" valor={texto(par.a)} onChange={(v) => onChange({ ...config, pares: trocarItem(pares, i, { a: v }) })} className="min-w-40 flex-1" />
            <Campo rotulo="Ícone a" valor={texto(par.icone_a)} placeholder="school" onChange={(v) => onChange({ ...config, pares: trocarItem(pares, i, { icone_a: v || null }) })} className="w-32" />
            <Campo rotulo="Direita (b)" valor={texto(par.b)} onChange={(v) => onChange({ ...config, pares: trocarItem(pares, i, { b: v }) })} className="min-w-40 flex-1" />
            <Campo rotulo="Ícone b" valor={texto(par.icone_b)} placeholder="book" onChange={(v) => onChange({ ...config, pares: trocarItem(pares, i, { icone_b: v || null }) })} className="w-32" />
            <BotaoRemover rotulo={`Remover par ${i + 1}`} disabled={pares.length <= 2} onClick={() => onChange({ ...config, pares: semItem(pares, i) })} />
          </div>
        ))}
        <BotaoAdicionar rotulo="Par" disabled={pares.length >= 8} onClick={() => onChange({ ...config, pares: [...pares, { a: "", b: "" }] })} />
      </div>

      <Campo rotulo="Dica (1º erro)" valor={texto(config.dica)} onChange={(v) => onChange({ ...config, dica: v })} />
    </div>
  );
}
