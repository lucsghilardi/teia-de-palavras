export const AUTH_COOKIE_NAME = "teia_sessao";

export const BACKEND_API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

export function getAuthCookieMaxAge(expiresIn?: number) {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Math.floor(expiresIn);
  }

  return 60 * 60;
}

/**
 * Atributos do cookie de sessão em um lugar só. Login, refresh (no proxy) e
 * logout precisam gravar exatamente os mesmos: o navegador identifica cookie
 * por nome+domínio+path, então um path ou sameSite divergente cria um segundo
 * cookie em vez de sobrescrever o primeiro.
 */
export function authCookieOptions(name: string = AUTH_COOKIE_NAME) {
  return {
    name,
    httpOnly: true,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export type RefreshedSession = {
  access_token: string;
  expires_in?: number;
};

/**
 * Troca um JWT expirado por um novo. Retorna null quando a sessão acabou de
 * vez (fora da janela de refresh_ttl, ou usuário desativado) — aí não adianta
 * repetir a chamada, a pessoa precisa logar de novo.
 *
 * Roda só no servidor (proxy e rotas /api/auth): o token nunca sai do cookie
 * httpOnly.
 */
export async function refreshSession(
  expiredToken: string,
  refreshPath: string = "/refresh",
): Promise<RefreshedSession | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}${refreshPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${expiredToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as RefreshedSession;
  } catch {
    return null;
  }
}
