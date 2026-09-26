import { NextResponse } from "next/server";

import { BACKEND_API_URL, authCookieOptions, getAuthCookieMaxAge } from "@/lib/auth";

type LoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Requisição inválida." },
      { status: 400 },
    );
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(`${BACKEND_API_URL}/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(request.headers.get("x-forwarded-for")
          ? { "x-forwarded-for": request.headers.get("x-forwarded-for") as string }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar à API." },
      { status: 502 },
    );
  }

  const responseBody = await parseJsonResponse(upstreamResponse);

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      responseBody ?? { message: "Falha ao autenticar." },
      { status: upstreamResponse.status },
    );
  }

  const data = responseBody as LoginResponse;
  const response = NextResponse.json({ authenticated: true });

  response.cookies.set({
    ...authCookieOptions(),
    value: data.access_token,
    maxAge: getAuthCookieMaxAge(data.expires_in),
  });

  return response;
}
