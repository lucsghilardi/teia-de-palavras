/** Avatar ou figura secreta oferecidos à criança (só as ativas, na ordem). */
export interface OpcaoVisual {
  chave: string;
  rotulo: string;
  /** Reserva textual (painel); o app da criança desenha o ícone. */
  emoji: string;
  /** Nome de ícone do lucide (lib/icones.ts). */
  icone: string | null;
  /** Cor de fundo do ícone (#rrggbb). */
  cor: string | null;
  imagem_url: string | null;
}

export interface OpcoesVisuais {
  avatares: OpcaoVisual[];
  figuras: OpcaoVisual[];
}
