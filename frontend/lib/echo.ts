import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { apiFetch } from "@/services/api";
import { criancaFetch } from "@/services/crianca";

// O broadcaster "reverb" do Laravel Echo usa o cliente do pusher-js, que precisa
// estar acessível globalmente.
if (typeof window !== "undefined") {
  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
}

type Autorizar = (corpo: { socket_id: string; channel_name: string }) => Promise<{ auth: string; channel_data?: string }>;

const instancias: Partial<Record<"adulto" | "crianca", Echo<"reverb">>> = {};

function criar(autorizar: Autorizar): Echo<"reverb"> | null {
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;

  if (!key) {
    return null;
  }

  const host = process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname;
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443);
  const forceTLS = (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "https") === "https";

  return new Echo<"reverb">({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    // Canais privados/presença são autorizados pelo proxy do Next, que injeta o
    // Bearer do cookie httpOnly: o JWT nunca chega ao JavaScript da página.
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        autorizar({ socket_id: socketId, channel_name: channel.name })
          .then((data) => callback(null, data))
          .catch((error: Error) => callback(error, null));
      },
    }),
  });
}

/**
 * Echo do educador (sessão `teia_sessao`, autoriza em /api/proxy/broadcasting/auth).
 * Retorna null no servidor (SSR) ou sem Reverb configurado: a tela segue com polling.
 */
export function getEcho(): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;

  instancias.adulto ??= criar((corpo) => apiFetch("/broadcasting/auth", { method: "POST", body: JSON.stringify(corpo) })) ?? undefined;

  return instancias.adulto ?? null;
}

/** Echo da criança (sessão `teia_crianca`, autoriza em /api/crianca-proxy/broadcasting/auth). */
export function getEchoCrianca(): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;

  instancias.crianca ??= criar((corpo) => criancaFetch("/broadcasting/auth", { method: "POST", body: JSON.stringify(corpo) })) ?? undefined;

  return instancias.crianca ?? null;
}
