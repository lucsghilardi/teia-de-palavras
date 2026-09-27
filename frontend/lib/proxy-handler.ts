import { NextRequest, NextResponse } from "next/server";

import {
  BACKEND_API_URL,
  authCookieOptions,
  getAuthCookieMaxAge,
  refreshSession,
  type RefreshedSession,
} from "@/lib/auth";

// x-forwarded-for/proto repassados para o backend saber o IP real do visitante:
// sem isso todo request chega ao Laravel com o IP deste container e o throttle
// do login perde a dimensão de origem. `x-forwarded-host` fica de fora de
// propósito, para o Host da requisição não virar entrada de quem chama.
const FORWARDED_HEADERS = [
  "accept",
  "content-type",
  "x-forwarded-for",
  "x-forwarded-proto",
];

// O que volta para o navegador. `content-disposition` e os dois de segurança
// entram porque anexos privados dependem deles para não serem interpretados
// como HTML.
const RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "content-security-policy",
  "x-content-type-options",
];

/**
 * `new URL(base + "/" + segmentos)` resolve ".." como o navegador resolveria —
 * "/api/proxy/../../up" sai do /api e bate em outra rota do backend, levando o
 * Bearer da pessoa junto. A URL também desfaz "%2e%2e", então não basta olhar o
 * texto: os segmentos são recusados quando são travessia e reencodados depois,
 * para que qualquer resto codificado chegue ao backend como nome literal.
 */
function isTraversal(segment: string) {
  return segment.length === 0 || segment === "." || segment === "..";
}

export type ProxyHandlerOptions = {
  /** Cookie httpOnly de onde sai o Bearer (ex.: sessão do educador). */
  cookieName: string;
  /** Endpoint do backend que troca um JWT vencido por um novo (ex.: "/refresh"). */
  refreshPath: string;
  /** Prefixos de rota que nunca devem passar pelo proxy (webhooks etc.). */
  blockedPaths?: RegExp[];
  /**
   * Segmento colocado antes do caminho no backend. Ex.: "crianca" faz
   * /api/crianca-proxy/mapa virar {BACKEND}/crianca/mapa.
   */
  upstreamPrefix?: string;
};

// login e refresh devolvem o JWT no corpo: passam só pelas rotas próprias do
// Next (que gravam o cookie httpOnly), nunca pelo proxy, para o token não
// chegar ao JavaScript da página.
const SEMPRE_BLOQUEADOS = [/^login$/, /^refresh$/];

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Handler genérico do proxy Next -> Laravel. Cada sessão (educador, criança)
 * instancia o seu com o próprio cookie; o resto do comportamento é igual:
 * injeta o Bearer, renova o token uma vez em 401 e limpa o cookie quando a
 * sessão morreu de vez.
 */
export function createProxyHandler({
  cookieName,
  refreshPath,
  blockedPaths = [],
  upstreamPrefix,
}: ProxyHandlerOptions) {
  const bloqueados = [...SEMPRE_BLOQUEADOS, ...blockedPaths];

  return async function handleProxy(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;

    if (path.some(isTraversal)) {
      return NextResponse.json({ message: "Rota inválida." }, { status: 400 });
    }

    const upstreamPath = path.map(encodeURIComponent).join("/");

    if (bloqueados.some((blocked) => blocked.test(upstreamPath))) {
      return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });
    }

    const prefixo = upstreamPrefix ? `${upstreamPrefix}/` : "";
    const upstreamUrl = new URL(`${BACKEND_API_URL}/${prefixo}${upstreamPath}`);

    upstreamUrl.search = request.nextUrl.search;

    const headers = new Headers();

    FORWARDED_HEADERS.forEach((headerName) => {
      const headerValue = request.headers.get(headerName);

      if (headerValue) {
        headers.set(headerName, headerValue);
      }
    });

    const token = request.cookies.get(cookieName)?.value;

    // O corpo é bufferizado antes do primeiro envio: o retry pós-refresh reenvia
    // os mesmos bytes, e um stream de request só pode ser consumido uma vez.
    let body: ArrayBuffer | undefined;

    if (!["GET", "HEAD"].includes(request.method)) {
      const bufferedBody = await request.arrayBuffer();

      if (bufferedBody.byteLength > 0) {
        body = bufferedBody;
      }
    }

    function sendUpstream(bearerToken?: string) {
      const upstreamHeaders = new Headers(headers);

      if (bearerToken) {
        upstreamHeaders.set("Authorization", `Bearer ${bearerToken}`);
      }

      return fetch(upstreamUrl, {
        method: request.method,
        headers: upstreamHeaders,
        cache: "no-store",
        body,
      });
    }

    try {
      let upstreamResponse = await sendUpstream(token);
      let renewedSession: RefreshedSession | null = null;
      let sessionIsOver = false;

      // 401 com cookie presente = token venceu. Renova e repete a chamada uma
      // única vez; a tela nem fica sabendo.
      if (upstreamResponse.status === 401 && token) {
        renewedSession = await refreshSession(token, refreshPath);

        if (renewedSession) {
          upstreamResponse = await sendUpstream(renewedSession.access_token);
        } else {
          sessionIsOver = true;
        }
      }

      const responseHeaders = new Headers();

      RESPONSE_HEADERS.forEach((headerName) => {
        const headerValue = upstreamResponse.headers.get(headerName);

        if (headerValue) {
          responseHeaders.set(headerName, headerValue);
        }
      });

      // 204/205/304 não podem levar corpo (nem vazio): o construtor de Response
      // lança TypeError e a chamada viraria 502.
      const semCorpo = [204, 205, 304].includes(upstreamResponse.status);

      const response = new NextResponse(semCorpo ? null : await upstreamResponse.arrayBuffer(), {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });

      if (renewedSession) {
        response.cookies.set({
          ...authCookieOptions(cookieName),
          value: renewedSession.access_token,
          maxAge: getAuthCookieMaxAge(renewedSession.expires_in),
        });
      }

      // Sessão morta: limpa o cookie para o proxy.ts parar de tratar a pessoa
      // como logada e mandar direto para /login na próxima navegação.
      if (sessionIsOver) {
        response.cookies.set({
          ...authCookieOptions(cookieName),
          value: "",
          maxAge: 0,
        });
      }

      return response;
    } catch {
      return NextResponse.json(
        { message: "Não foi possível conectar à API." },
        { status: 502 },
      );
    }
  };
}
