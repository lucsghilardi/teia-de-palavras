"use client";

import { CATALOGO_ILUSTRACOES, existeIlustracao, type GrupoIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import { CenaIlustrada } from "@/components/crianca/ilustracoes/cena-ilustrada";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NENHUMA = "__nenhuma__";

const GRUPOS: Record<GrupoIlustracao, string> = {
  capas: "Capas",
  portugues: "Português",
  matematica: "Matemática",
  geografia: "Geografia",
  historia: "História",
};

/**
 * Escolhe uma cena desenhada pelo app (catálogo da temporada) com prévia.
 * Imagem enviada no mesmo lugar continua vencendo a cena no app.
 */
export function SeletorIlustracao({
  id,
  rotulo,
  valor,
  onChange,
  descricao,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  descricao?: string;
}) {
  const conhecida = existeIlustracao(valor);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <div className="flex items-start gap-3">
        <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg border bg-slate-900">
          {conhecida ? <CenaIlustrada chave={valor} /> : null}
        </div>
        <Select value={valor || NENHUMA} onValueChange={(v) => onChange(v === NENHUMA ? "" : v)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUMA}>Sem ilustração</SelectItem>
            {(Object.keys(GRUPOS) as GrupoIlustracao[]).map((grupo) => (
              <SelectGroup key={grupo}>
                <SelectLabel>{GRUPOS[grupo]}</SelectLabel>
                {CATALOGO_ILUSTRACOES.filter((item) => item.grupo === grupo).map((item) => (
                  <SelectItem key={item.chave} value={item.chave}>
                    {item.rotulo}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            {valor && !conhecida ? <SelectItem value={valor}>Chave desconhecida: {valor}</SelectItem> : null}
          </SelectContent>
        </Select>
      </div>
      {descricao ? <FieldDescription>{descricao}</FieldDescription> : null}
    </Field>
  );
}
