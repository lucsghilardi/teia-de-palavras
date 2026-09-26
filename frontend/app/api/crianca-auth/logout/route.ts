import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_URL, authCookieOptions } from "@/lib/auth";
import { CRIANCA_COOKIE_NAME } from "@/lib/crianca-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(CRIANCA_COOKIE_NAME)?.value;

  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/crianca/sair`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // Melhor esforço: o cookie local sai de qualquer jeito.
    }
  }

  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({ ...authCookieOptions(CRIANCA_COOKIE_NAME), value: "", maxAge: 0 });

  return response;
}
