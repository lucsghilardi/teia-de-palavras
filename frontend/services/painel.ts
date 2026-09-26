import { apiFetch } from "./api";
import type {
  Aula,
  AulaResumo,
  CreateAulaPayload,
  RemoveAulaMidiaPayload,
  SugerirFamiliaResponse,
  UpdateAulaPayload,
  UploadAulaMidiaPayload,
  UploadAulaMidiaResponse,
} from "@/types/Aula";
import type { Configuracoes } from "@/types/Configuracoes";
import type {
  CreateCriancaPayload,
  Crianca,
  ListCriancasParams,
  UpdateCriancaPayload,
} from "@/types/Crianca";
import type { OpcoesVisuais } from "@/types/OpcaoVisual";
import type {
  CreatePalavraPayload,
  ImportarDicionarioResponse,
  ListDicionarioParams,
  Palavra,
  UpdatePalavraPayload,
} from "@/types/Palavra";
import type {
  CreateTurmaPayload,
  Turma,
  TurmaDetalhe,
  UpdateTurmaPayload,
} from "@/types/Turma";

// Endpoints do painel do educador (contrato em docs/api-painel.md).
// Tudo passa por `apiFetch` → /api/proxy, que injeta o Bearer do cookie.

function withQuery(path: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();

  return query ? `${path}?${query}` : path;
}

function jsonBody(data: unknown): RequestInit["body"] {
  return JSON.stringify(data);
}

// ===== Opções visuais (avatares e figuras secretas) =====

export function getOpcoesVisuais() {
  return apiFetch<OpcoesVisuais>("/painel/opcoes-visuais");
}

// ===== Turmas =====

export function listTurmas() {
  return apiFetch<Turma[]>("/painel/turmas");
}

export function getTurma(id: number) {
  return apiFetch<TurmaDetalhe>(`/painel/turmas/${id}`);
}

export function createTurma(data: CreateTurmaPayload) {
  return apiFetch<Turma>("/painel/turmas", {
    method: "POST",
    body: jsonBody(data),
  });
}

export function updateTurma(id: number, data: UpdateTurmaPayload) {
  return apiFetch<Turma>(`/painel/turmas/${id}`, {
    method: "PUT",
    body: jsonBody(data),
  });
}

/** Gera outro código de 6 caracteres; o anterior deixa de valer. */
export function gerarNovoCodigoTurma(id: number) {
  return apiFetch<Turma>(`/painel/turmas/${id}/novo-codigo`, {
    method: "POST",
  });
}

/** Só funciona para turma sem crianças (senão 422). */
export function deleteTurma(id: number) {
  return apiFetch<null>(`/painel/turmas/${id}`, { method: "DELETE" });
}

// ===== Crianças =====

export function listCriancas(params: ListCriancasParams = {}) {
  return apiFetch<Crianca[]>(
    withQuery("/painel/criancas", {
      turma_id: params.turma_id ? String(params.turma_id) : undefined,
    }),
  );
}

export function getCrianca(id: number) {
  return apiFetch<Crianca>(`/painel/criancas/${id}`);
}

export function createCrianca(data: CreateCriancaPayload) {
  return apiFetch<Crianca>("/painel/criancas", {
    method: "POST",
    body: jsonBody(data),
  });
}

export function updateCrianca(id: number, data: UpdateCriancaPayload) {
  return apiFetch<Crianca>(`/painel/criancas/${id}`, {
    method: "PUT",
    body: jsonBody(data),
  });
}

/** Redefine a figura secreta e desbloqueia a criança. */
export function redefinirFiguraSecreta(id: number, figuraSecretaChave: string) {
  return apiFetch<Crianca>(`/painel/criancas/${id}/figura-secreta`, {
    method: "POST",
    body: jsonBody({ figura_secreta_chave: figuraSecretaChave }),
  });
}

export function solicitarExclusaoCrianca(id: number) {
  return apiFetch<Crianca>(`/painel/criancas/${id}/solicitar-exclusao`, {
    method: "POST",
  });
}

export function deleteCrianca(id: number) {
  return apiFetch<null>(`/painel/criancas/${id}`, { method: "DELETE" });
}

// ===== Aulas (CMS) =====

export function listAulas() {
  return apiFetch<AulaResumo[]>("/painel/aulas");
}

export function getAula(id: number) {
  return apiFetch<Aula>(`/painel/aulas/${id}`);
}

export function createAula(data: CreateAulaPayload) {
  return apiFetch<Aula>("/painel/aulas", {
    method: "POST",
    body: jsonBody(data),
  });
}

/** Envia o documento completo; o backend sincroniza os filhos. */
export function updateAula(id: number, data: UpdateAulaPayload) {
  return apiFetch<Aula>(`/painel/aulas/${id}`, {
    method: "PUT",
    body: jsonBody(data),
  });
}

/** 422 se faltar ≥1 sílaba, ≥1 página ou ≥1 palavra. */
export function publicarAula(id: number) {
  return apiFetch<Aula>(`/painel/aulas/${id}/publicar`, { method: "POST" });
}

export function despublicarAula(id: number) {
  return apiFetch<Aula>(`/painel/aulas/${id}/despublicar`, { method: "POST" });
}

/** Nova ordem (ids) dentro de uma mesma fase. */
export function reordenarAulas(ordem: number[]) {
  return apiFetch<AulaResumo[]>("/painel/aulas/reordenar", {
    method: "PUT",
    body: jsonBody({ ordem }),
  });
}

/** Só rascunho sem progresso de criança (senão 422). */
export function deleteAula(id: number) {
  return apiFetch<null>(`/painel/aulas/${id}`, { method: "DELETE" });
}

export function uploadAulaMidia(id: number, data: UploadAulaMidiaPayload) {
  const formData = new FormData();

  formData.append("alvo", data.alvo);

  if (data.alvo_id !== undefined) {
    formData.append("alvo_id", String(data.alvo_id));
  }

  formData.append("arquivo", data.arquivo);

  return apiFetch<UploadAulaMidiaResponse>(`/painel/aulas/${id}/midia`, {
    method: "POST",
    body: formData,
  });
}

export function removeAulaMidia(id: number, data: RemoveAulaMidiaPayload) {
  return apiFetch<null>(`/painel/aulas/${id}/midia`, {
    method: "DELETE",
    body: jsonBody(data),
  });
}

export function sugerirFamilia(silaba: string) {
  return apiFetch<SugerirFamiliaResponse>("/painel/silabas/sugerir-familia", {
    method: "POST",
    body: jsonBody({ silaba }),
  });
}

// ===== Dicionário geral =====

export function listDicionario(params: ListDicionarioParams = {}) {
  return apiFetch<Palavra[]>(
    withQuery("/painel/dicionario", {
      busca: params.busca?.trim() || undefined,
      // "1"/"0" passam na regra `boolean` do Laravel ("true"/"false" não).
      aprovada:
        params.aprovada === undefined || params.aprovada === null
          ? undefined
          : params.aprovada
            ? "1"
            : "0",
    }),
  );
}

export function createPalavra(data: CreatePalavraPayload) {
  return apiFetch<Palavra>("/painel/dicionario", {
    method: "POST",
    body: jsonBody(data),
  });
}

/** Uma palavra por linha: "CASA CA-SA". */
export function importarDicionario(texto: string) {
  return apiFetch<ImportarDicionarioResponse>("/painel/dicionario/importar", {
    method: "POST",
    body: jsonBody({ texto }),
  });
}

export function updatePalavra(id: number, data: UpdatePalavraPayload) {
  return apiFetch<Palavra>(`/painel/dicionario/${id}`, {
    method: "PUT",
    body: jsonBody(data),
  });
}

export function deletePalavra(id: number) {
  return apiFetch<null>(`/painel/dicionario/${id}`, { method: "DELETE" });
}

// ===== Configurações =====

export function getConfiguracoes() {
  return apiFetch<Configuracoes>("/painel/configuracoes");
}

export function updateConfiguracoes(data: Configuracoes) {
  return apiFetch<Configuracoes>("/painel/configuracoes", {
    method: "PUT",
    body: jsonBody(data),
  });
}
