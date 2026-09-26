import { NextResponse } from "next/server";

import { BACKEND_API_URL, authCookieOptions, getAuthCookieMaxAge } from "@/lib/auth";
import { CRIANCA_COOKIE_NAME } from "@/lib/crianca-auth";

type LoginResponse = { access_token: string; expires_in?: number };

/**
 * Entrada da criança (turma + avatar + figura secreta). Repassa ao backend e,
 * se der certo, grava o JWT só no cookie httpOnly. Erros (422 figura, 423
 * bloqueio, 429) voltam com o corpo original, que já traz mensagem gentil.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  let upstream: Response;

  try {
    const forwardedFor = request.headers.get("x-forwarded-for");

    upstream = await fetch(`${BACKEND_API_URL}/crianca/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar à API." }, { status: 502 });
  }

  const texto = await upstream.text();
  let corpo: unknown = null;

  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = { message: texto };
  }

  if (!upstream.ok) {
    return NextResponse.json(corpo ?? { message: "Não foi possível entrar." }, { status: upstream.status });
  }

  const dados = corpo as LoginResponse;
  const response = NextResponse.json({ authenticated: true });

  response.cookies.set({
    ...authCookieOptions(CRIANCA_COOKIE_NAME),
    value: dados.access_token,
    maxAge: getAuthCookieMaxAge(dados.expires_in),
  });

  return response;
}
