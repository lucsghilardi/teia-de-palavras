/** Avatar ou figura secreta oferecidos à criança (só as ativas, na ordem). */
export interface OpcaoVisual {
  chave: string;
  rotulo: string;
  emoji: string;
  imagem_url: string | null;
}

export interface OpcoesVisuais {
  avatares: OpcaoVisual[];
  figuras: OpcaoVisual[];
}
