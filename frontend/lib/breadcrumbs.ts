/**
 * Rótulo de cada segmento de rota na trilha do cabeçalho. Segmento não
 * mapeado cai no fallback (primeira letra maiúscula).
 */
export const breadcrumbMap: Record<string, string> = {
  painel: "Painel",
  criancas: "Crianças",
  turmas: "Turmas",
  aulas: "Aulas",
  dicionario: "Dicionário",
  gravacoes: "Gravações",
  progresso: "Progresso",
  configuracoes: "Configurações",
  usuarios: "Usuários",
  perfil: "Minha conta",
};

/**
 * Rotas de detalhe terminam num id numérico (/criancas/42), que sem
 * tratamento apareceria cru na trilha. "Detalhe" diz mais do que "42".
 */
export function rotuloBreadcrumb(segment: string): string {
  if (breadcrumbMap[segment]) return breadcrumbMap[segment];
  if (/^\d+$/.test(segment)) return "Detalhe";

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
