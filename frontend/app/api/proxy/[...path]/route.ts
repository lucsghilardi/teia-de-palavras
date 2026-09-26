import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { createProxyHandler } from "@/lib/proxy-handler";

// Proxy da sessão do educador/admin: o Bearer sai do cookie httpOnly
// `teia_sessao`. A sessão da criança terá um proxy próprio com outro cookie.
const handleProxy = createProxyHandler({
  cookieName: AUTH_COOKIE_NAME,
  refreshPath: "/refresh",
});

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
