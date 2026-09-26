import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenText,
  Handshake,
  Home,
  Mic,
  Orbit,
  School,
  Settings,
  Smile,
  UserCog,
  Users,
} from "lucide-react";

import type { UserRole } from "@/types/User";

type PainelRouteRule = {
  path: string;
  roles: UserRole[];
  exact?: boolean;
};

export type PainelNavItem = {
  title: string;
  url: string;
  roles: UserRole[];
  icon: LucideIcon;
  /** Fica fora do menu lateral (ex.: acessível só pelo menu do avatar). */
  hidden?: boolean;
};

const ALL_ROLES: UserRole[] = ["admin", "educador"];

/** Tela inicial do painel: para onde "/" e o login levam. */
export const PAINEL_HOME_ROUTE = "/painel";

export const painelNav: PainelNavItem[] = [
  { title: "Início", url: "/painel", roles: ALL_ROLES, icon: Home },
  { title: "Crianças", url: "/painel/criancas", roles: ALL_ROLES, icon: Smile },
  { title: "Turmas", url: "/painel/turmas", roles: ALL_ROLES, icon: School },
  { title: "Amizades", url: "/painel/amizades", roles: ALL_ROLES, icon: Handshake },
  { title: "Aulas", url: "/painel/aulas", roles: ALL_ROLES, icon: BookOpenText },
  { title: "Dicionário", url: "/painel/dicionario", roles: ALL_ROLES, icon: BookOpenText },
  { title: "Mini-aulas", url: "/painel/mini-aulas", roles: ALL_ROLES, icon: Mic },
  { title: "Rodas", url: "/painel/rodas", roles: ALL_ROLES, icon: Orbit },
  { title: "Progresso", url: "/painel/progresso", roles: ALL_ROLES, icon: BarChart3 },
  { title: "Configurações", url: "/painel/configuracoes", roles: ALL_ROLES, icon: Settings },
  { title: "Usuários", url: "/painel/usuarios", roles: ["admin"], icon: Users },
  { title: "Minha conta", url: "/painel/perfil", roles: ALL_ROLES, icon: UserCog, hidden: true },
];

// Regras derivadas do menu: rota não mapeada é tratada como proibida.
const painelRouteRules: PainelRouteRule[] = [
  ...painelNav
    .filter((item) => item.url !== PAINEL_HOME_ROUTE)
    .map((item) => ({ path: item.url, roles: item.roles })),
  { path: PAINEL_HOME_ROUTE, roles: ALL_ROLES, exact: true },
];

export function canAccessPainelRoute(role: UserRole, pathname: string) {
  const matchedRule = painelRouteRules.find((rule) => {
    if (rule.exact) {
      return pathname === rule.path;
    }

    return pathname === rule.path || pathname.startsWith(`${rule.path}/`);
  });

  if (!matchedRule) {
    return false;
  }

  return matchedRule.roles.includes(role);
}

/** Itens do menu lateral visíveis para o papel (sem os `hidden`). */
export function getPainelNavForRole(role: UserRole): PainelNavItem[] {
  return painelNav.filter((item) => !item.hidden && item.roles.includes(role));
}

export function isPainelItemActive(pathname: string, url: string) {
  if (url === PAINEL_HOME_ROUTE) {
    return pathname === url;
  }

  return pathname === url || pathname.startsWith(`${url}/`);
}

export function getPainelFallbackRoute(role: UserRole) {
  if (canAccessPainelRoute(role, PAINEL_HOME_ROUTE)) {
    return PAINEL_HOME_ROUTE;
  }

  return getPainelNavForRole(role)[0]?.url ?? PAINEL_HOME_ROUTE;
}

