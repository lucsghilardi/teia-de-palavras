import { redirect } from "next/navigation";

import { PAINEL_HOME_ROUTE } from "@/lib/painel-access";

export default function Home() {
  // Sem site público por enquanto: a raiz leva ao painel. O proxy.ts manda
  // para /login quando não há sessão.
  redirect(PAINEL_HOME_ROUTE);
}
