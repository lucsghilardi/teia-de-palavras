import type { UserRole } from "@/types/User";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  educador: "Educador",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Usa o painel e também cria, edita e desativa contas de usuários.",
  educador: "Acompanha crianças, turmas e aulas. Não gerencia usuários.",
};

export const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  educador: 1,
};

/** Papéis oferecidos ao criar/editar um usuário. */
export const ROLE_OPTIONS: UserRole[] = ["admin", "educador"];
