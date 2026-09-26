import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, BACKEND_API_URL, authCookieOptions } from "@/lib/auth";

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    ...authCookieOptions(),
    value: "",
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // Melhor esforço: o cookie local precisa ser removido de qualquer forma.
    }
  }

  const response = NextResponse.json({ authenticated: false });
  clearAuthCookie(response);

  return response;
}
