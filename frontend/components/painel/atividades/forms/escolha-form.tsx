"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { BotaoAdicionar, BotaoRemover, Campo, lista, numero, semItem, texto, trocarItem, type Config, type FormProps } from "./comuns";

const MAX_ITENS = 12;
const MAX_OPCOES = 6;

/** Formulário de `escolha` (pergunta + opções) e `verdadeiro_falso` (frase + verdadeiro/falso). */
export function EscolhaForm({ tipo, config, onChange }: FormProps & { tipo: "escolha" | "verdadeiro_falso" }) {
  const itens = lista(config.itens);
  const vf = tipo === "verdadeiro_falso";

  const definirItens = (novos: Config[]) => onChange({ ...config, itens: novos });

  const novoItem = (): Config =>
    vf ? { frase: "", correta: true, dica: "", explicacao: "" } : { pergunta: "", opcoes: ["", ""], correta: 0, dica: "", explicacao: "" };

  return (
    <div className="space-y-3">
      {itens.map((item, i) => {
        const opcoes = lista<string>(item.opcoes).map((o) => texto(o));

        return (
          <div key={i} className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-start gap-2">
              <Campo
                rotulo={vf ? `Frase ${i + 1}` : `Pergunta ${i + 1}`}
                valor={texto(vf ? item.frase : item.pergunta)}
                onChange={(v) => definirItens(trocarItem(itens, i, vf ? { frase: v } : { pergunta: v }))}
                className="flex-1"
              />
              <BotaoRemover rotulo={`Remover ${vf ? "frase" : "pergunta"} ${i + 1}`} onClick={() => definirItens(semItem(itens, i))} disabled={itens.length <= 1} />
            </div>

            {vf ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">Resposta</span>
                <Select
                  value={item.correta === false || item.correta === "false" ? "falso" : "verdadeiro"}
                  onValueChange={(v) => definirItens(trocarItem(itens, i, { correta: v === "verdadeiro" }))}
                >
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verdadeiro">verdadeiro</SelectItem>
                    <SelectItem value="falso">falso</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ) : (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-muted-foreground">Opções (marque a certa)</span>
                {opcoes.map((opcao, o) => (
                  <div key={o} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correta-${i}`}
                      aria-label={`Opção ${o + 1} é a certa`}
                      checked={numero(item.correta) === o}
                      onChange={() => definirItens(trocarItem(itens, i, { correta: o }))}
                      className="size-4 accent-primary"
                    />
                    <input
                      aria-label={`Opção ${o + 1}`}
                      value={opcao}
                      onChange={(event) => {
                        const novas = [...opcoes];
                        novas[o] = event.target.value;
                        definirItens(trocarItem(itens, i, { opcoes: novas }));
                      }}
                      className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                    />
                    <BotaoRemover
                      rotulo={`Remover opção ${o + 1}`}
                      disabled={opcoes.length <= 2}
                      onClick={() => {
                        const novas = opcoes.filter((_, k) => k !== o);
                        const correta = Math.min(numero(item.correta), novas.length - 1);
                        definirItens(trocarItem(itens, i, { opcoes: novas, correta: correta < 0 ? 0 : correta }));
                      }}
                    />
                  </div>
                ))}
                <BotaoAdicionar
                  rotulo="Opção"
                  disabled={opcoes.length >= MAX_OPCOES}
                  onClick={() => definirItens(trocarItem(itens, i, { opcoes: [...opcoes, ""] }))}
                />
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Campo rotulo="Dica (1º erro)" valor={texto(item.dica)} onChange={(v) => definirItens(trocarItem(itens, i, { dica: v }))} />
              <Campo rotulo="Explicação (2º erro)" valor={texto(item.explicacao)} onChange={(v) => definirItens(trocarItem(itens, i, { explicacao: v }))} />
              <Campo rotulo="Ícone (lucide)" valor={texto(item.icone)} placeholder="rocket" onChange={(v) => definirItens(trocarItem(itens, i, { icone: v || null }))} />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <BotaoAdicionar rotulo={vf ? "Frase" : "Pergunta"} disabled={itens.length >= MAX_ITENS} onClick={() => definirItens([...itens, novoItem()])} />
        {vf ? null : (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={config.embaralhar !== false} onCheckedChange={(v) => onChange({ ...config, embaralhar: v })} />
            Embaralhar as opções
          </label>
        )}
      </div>
    </div>
  );
}
