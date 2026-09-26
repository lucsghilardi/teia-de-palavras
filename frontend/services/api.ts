import { ApiError, UnauthorizedError } from "./apiError";
import type {
  CreateUserPayload,
  UpdatePasswordPayload,
  UpdateUserPayload,
  User,
} from "@/types/User";

// Tudo passa pelo proxy do Next (mesma origem): o navegador nunca vê o JWT,
// que fica no cookie httpOnly e é injetado como Bearer no servidor.
const API_URL = "/api/proxy";

async function parseApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      throw new UnauthorizedError();
    }

    const responseText = await res.text();
    let parsedBody: {
      message?: string;
      errors?: Record<string, string[]>;
    } | null = null;

    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText) as {
          message?: string;
          errors?: Record<string, string[]>;
        };
      } catch {
        parsedBody = null;
      }
    }

    if (parsedBody) {
      const firstValidationError = parsedBody.errors
        ? Object.values(parsedBody.errors).flat()[0]
        : null;

      throw new ApiError(
        res.status,
        firstValidationError || parsedBody.message || "Erro na API",
        parsedBody,
      );
    }

    throw new ApiError(res.status, responseText || "Erro na API");
  }

  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

/**
 * Chamada genérica à API via /api/proxy. Aceita JSON (padrão) ou FormData —
 * neste caso o Content-Type fica por conta do navegador (boundary).
 * Lança `UnauthorizedError` em 401 e `ApiError` nos demais erros.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Sem Accept explícito o Laravel responde erros de validação com redirect
  // HTML em vez de JSON 422 (o proxy repassa o Accept ao backend).
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  return parseApiResponse<T>(res);
}

// ===== Autenticação (rotas próprias do Next, fora do proxy) =====

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  await parseApiResponse<{ authenticated: boolean }>(res);
}

export async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  await parseApiResponse<{ authenticated: boolean }>(res);
}

export function getMe() {
  return apiFetch<User>("/me");
}

/**
 * Fora do proxy: a rota própria reescreve o cookie com o token novo, já que
 * trocar a senha invalida o anterior no backend.
 */
export async function updatePassword(data: UpdatePasswordPayload): Promise<void> {
  const res = await fetch("/api/auth/password", {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await parseApiResponse<{ message: string }>(res);
}

// ===== Usuários (somente admin) =====

export function listUsers() {
  return apiFetch<User[]>("/painel/users");
}

export function createUser(data: CreateUserPayload) {
  return apiFetch<User>("/painel/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: number, data: UpdateUserPayload) {
  return apiFetch<User>(`/painel/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
