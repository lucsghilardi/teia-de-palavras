"use client";

import type { Config } from "./comuns";
import { ContarForm } from "./contar-form";
import { EscolhaForm } from "./escolha-form";
import { OrdenarForm, ParearForm } from "./ordenar-parear-form";
import { SomarSubtrairForm } from "./somar-subtrair-form";

export const TIPOS_COM_FORMULARIO = ["escolha", "verdadeiro_falso", "ordenar", "linha_do_tempo", "parear", "contar", "somar_subtrair"];

export function temFormulario(tipo: string): boolean {
  return TIPOS_COM_FORMULARIO.includes(tipo);
}

/**
 * Formulário amigável para os tipos mais usados (o JSON continua disponível
 * para os outros e para ajustes finos). O backend valida ao salvar.
 */
export function FormularioAtividade({ tipo, config, onChange }: { tipo: string; config: Config; onChange: (config: Config) => void }) {
  switch (tipo) {
    case "escolha":
    case "verdadeiro_falso":
      return <EscolhaForm tipo={tipo} config={config} onChange={onChange} />;
    case "ordenar":
    case "linha_do_tempo":
      return <OrdenarForm config={config} onChange={onChange} />;
    case "parear":
      return <ParearForm config={config} onChange={onChange} />;
    case "contar":
      return <ContarForm config={config} onChange={onChange} />;
    case "somar_subtrair":
      return <SomarSubtrairForm config={config} onChange={onChange} />;
    default:
      return null;
  }
}
