/**
 * Geometria da Teia de Palavras.
 *
 * As palavras ocupam células de uma grade invisível centrada na aranha (o
 * "cubo" da teia), da mais perto para a mais longe do centro — como a lista
 * vem da mais recente para a mais antiga, as novas ficam no meio. Assim as
 * fichas nunca se sobrepõem, em qualquer largura, e a teia cresce para baixo
 * e para cima (rolagem só vertical).
 *
 * O desenho (fios radiais + anéis) é decorativo e ganha anéis conforme o total.
 */

const LARGURA_MIN_CELULA = 120;
const MAX_COLUNAS = 9;
const ALTURA_CELULA = 84;
const ALTURA_CELULA_COM_IMAGEM = 108;
const MARGEM = 16;
const MIN_ANEIS = 3;
const MAX_ANEIS = 18;
/** Distância entre anéis: menor que uma linha de fichas, para a teia crescer cedo. */
const PASSO_ANEL = 60;
const FIOS = 12;

export type PosicaoFicha = { x: number; y: number };

export type LayoutTeia = {
  largura: number;
  altura: number;
  centro: PosicaoFicha;
  larguraCelula: number;
  alturaCelula: number;
  fichas: PosicaoFicha[];
  /** Caminhos SVG já prontos. */
  fios: string[];
  aneis: string[];
};

function colunasPara(largura: number): number {
  let colunas = Math.floor(largura / LARGURA_MIN_CELULA);

  if (colunas % 2 === 0) colunas -= 1;

  return Math.min(MAX_COLUNAS, Math.max(3, colunas));
}

/** Ângulo começando no alto e girando no sentido horário (na tela). */
function giro(x: number, y: number): number {
  return (Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
}

export function calcularLayoutTeia(largura: number, total: number, comImagem: boolean): LayoutTeia {
  const colunas = colunasPara(largura);
  const larguraCelula = largura / colunas;
  const alturaCelula = comImagem ? ALTURA_CELULA_COM_IMAGEM : ALTURA_CELULA;
  const meiaLargura = (colunas - 1) / 2;

  // Linhas suficientes para caber todo mundo (cada linha tem `colunas` células).
  const raioLinhas = Math.ceil(total / colunas) + 1;
  const celulas: { gx: number; gy: number; d: number; a: number }[] = [];

  for (let gy = -raioLinhas; gy <= raioLinhas; gy += 1) {
    for (let gx = -meiaLargura; gx <= meiaLargura; gx += 1) {
      if (gx === 0 && gy === 0) continue; // o centro é da aranha

      const d = Math.round(Math.hypot(gx * larguraCelula, gy * alturaCelula) * 10) / 10;
      celulas.push({ gx, gy, d, a: giro(gx, gy) });
    }
  }

  celulas.sort((p, q) => p.d - q.d || p.a - q.a);
  const usadas = celulas.slice(0, total);

  const maiorLinha = usadas.reduce((m, c) => Math.max(m, Math.abs(c.gy)), 1);
  const maiorDistancia = usadas.reduce((m, c) => Math.max(m, c.d), 0);

  const alturaGrade = (2 * maiorLinha + 1) * alturaCelula + 2 * MARGEM;
  const altura = Math.round(Math.max(alturaGrade, Math.min(largura * 0.9, 460)));
  const centro = { x: largura / 2, y: altura / 2 };

  const fichas = usadas.map((c) => ({
    x: centro.x + c.gx * larguraCelula,
    y: centro.y + c.gy * alturaCelula,
  }));

  // Anéis: mais palavras, mais anéis. A teia é achatada/esticada para caber na caixa.
  const passo = PASSO_ANEL;
  const quantosAneis = Math.min(MAX_ANEIS, Math.max(MIN_ANEIS, Math.ceil((maiorDistancia + passo * 0.6) / passo)));
  const raioMaximo = quantosAneis * passo;
  const escalaX = Math.min(1, (largura / 2 - 4) / raioMaximo);
  const escalaY = Math.min(1, (altura / 2 - 4) / raioMaximo);

  const ponto = (raio: number, angulo: number) =>
    `${(centro.x + raio * Math.cos(angulo) * escalaX).toFixed(1)} ${(centro.y + raio * Math.sin(angulo) * escalaY).toFixed(1)}`;

  const angulos = Array.from({ length: FIOS }, (_, j) => -Math.PI / 2 + (j * 2 * Math.PI) / FIOS);

  const fios = angulos.map((a) => `M ${ponto(0, a)} L ${ponto(raioMaximo * 1.04, a)}`);

  const aneis = Array.from({ length: quantosAneis }, (_, k) => {
    const raio = (k + 1) * passo;
    let d = `M ${ponto(raio, angulos[0])}`;

    angulos.forEach((a, j) => {
      const proximo = angulos[(j + 1) % FIOS] + (j === FIOS - 1 ? 2 * Math.PI : 0);
      // O fio "cede" para o centro entre dois raios, como numa teia de verdade.
      d += ` Q ${ponto(raio * 0.88, (a + proximo) / 2)} ${ponto(raio, proximo)}`;
    });

    return `${d} Z`;
  });

  return { largura, altura, centro, larguraCelula, alturaCelula, fichas, fios, aneis };
}

/** Fonte que faz a palavra inteira caber na ficha (nunca corta a palavra). */
export function tamanhoFonte(palavra: string, larguraCelula: number): number {
  const util = larguraCelula - 26;
  const porLetra = 0.72;

  return Math.max(14, Math.min(26, Math.floor(util / (Math.max(1, palavra.length) * porLetra))));
}
