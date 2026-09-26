"use client";

import { BotaoAdicionar, BotaoRemover, Campo, lista, numero, semItem, texto, trocarItem, type FormProps } from "./comuns";

/** Formulário de `contar`: um ícone e uma quantidade por item (as opções o backend gera). */
export function ContarForm({ config, onChange }: FormProps) {
  const itens = lista(config.itens);

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      {itens.map((item, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <Campo rotulo="Ícone (lucide)" valor={texto(item.icone)} placeholder="star" onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { icone: v }) })} className="w-44" />
          <Campo rotulo="Quantidade (1 a 100)" tipo="number" min={1} max={100} valor={numero(item.quantidade, 1)} onChange={(v) => onChange({ ...config, itens: trocarItem(itens, i, { quantidade: numero(v, 1) }) })} className="w-40" />
          <BotaoRemover rotulo={`Remover item ${i + 1}`} disabled={itens.length <= 1} onClick={() => onChange({ ...config, itens: semItem(itens, i) })} />
        </div>
      ))}
      <BotaoAdicionar rotulo="Item" disabled={itens.length >= 10} onClick={() => onChange({ ...config, itens: [...itens, { icone: "star", quantidade: 10 }] })} />
    </div>
  );
}
