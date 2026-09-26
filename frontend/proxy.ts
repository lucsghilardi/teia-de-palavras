import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { CRIANCA_COOKIE_NAME } from "@/lib/crianca-auth";
import { PAINEL_HOME_ROUTE } from "@/lib/painel-access";

/**
 * Guarda de rotas (Next 16: `proxy.ts` substitui o antigo `middleware.ts`).
 *
 * Só olha a presença do cookie — a validade do JWT é checada pelo backend, e
 * os providers (AuthProvider no painel, CriancaProvider no app) redirecionam
 * quando ele responde 401.
 *  - /painel/*  precisa de `teia_sessao` (educador)
 *  - /app/*     precisa de `teia_crianca` (criança), menos /app/entrar
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(PAINEL_HOME_ROUTE, request.url));
  }

  const tokenAdulto = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isPainelRoute = pathname === "/painel" || pathname.startsWith("/painel/");

  if (isPainelRoute && !tokenAdulto) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && tokenAdulto) {
    return NextResponse.redirect(new URL(PAINEL_HOME_ROUTE, request.url));
  }

  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isEntrada = pathname === "/app/entrar" || pathname.startsWith("/app/entrar/");

  if (isAppRoute && !isEntrada && !request.cookies.get(CRIANCA_COOKIE_NAME)?.value) {
    return NextResponse.redirect(new URL("/app/entrar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/painel/:path*", "/login", "/app/:path*"],
};
