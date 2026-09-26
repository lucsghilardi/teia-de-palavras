import { CRIANCA_COOKIE_NAME } from "@/lib/crianca-auth";
import { createProxyHandler } from "@/lib/proxy-handler";

// Proxy do app da criança: /api/crianca-proxy/<caminho> → {API}/crianca/<caminho>,
// com o Bearer do cookie httpOnly `teia_crianca` (renovado no 401).
const handleProxy = createProxyHandler({
  cookieName: CRIANCA_COOKIE_NAME,
  refreshPath: "/crianca/refresh",
  upstreamPrefix: "crianca",
});

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
