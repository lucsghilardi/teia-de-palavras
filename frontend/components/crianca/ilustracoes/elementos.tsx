import { useId, type ReactNode } from "react";

import { COR } from "@/components/crianca/ilustracoes/paleta";

/**
 * Peças de cenário das ilustrações (fundo, chão, blocos, placas...). Todas as
 * cenas usam viewBox 0 0 400 300 e mantêm o que importa entre x 50–350 e
 * y 50–250: o quadro corta as bordas conforme a tela (retrato ou paisagem).
 */

export const LARGURA = 400;
export const ALTURA = 300;

/** Quadro da cena: preenche o espaço todo, cortando as bordas se precisar. */
export function Cena({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={titulo}
      className="block h-full w-full"
      fontFamily="inherit"
    >
      {children}
    </svg>
  );
}

// Estrelas fixas (sem aleatório: o desenho é o mesmo no servidor e no navegador).
const ESTRELAS: [number, number, number][] = [
  [22, 30, 1.6], [64, 76, 1.1], [98, 22, 1.9], [140, 58, 1.2], [176, 18, 1.4], [214, 64, 1],
  [248, 28, 1.8], [286, 70, 1.2], [322, 20, 1.5], [360, 52, 1.1], [388, 26, 1.7], [40, 120, 1.2],
  [120, 110, 1], [300, 118, 1.3], [372, 108, 1], [10, 80, 1.2], [230, 104, 1.1], [160, 136, 0.9],
];

/** Céu do espaço (noite), com estrelas que piscam devagar. */
export function CeuEstrelado({ claro = false }: { claro?: boolean }) {
  const id = useId();

  return (
    <g>
      <defs>
        <linearGradient id={`ceu${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COR.ceu} />
          <stop offset="1" stopColor={claro ? COR.ceu3 : COR.ceu2} />
        </linearGradient>
      </defs>
      <rect width={LARGURA} height={ALTURA} fill={`url(#ceu${id})`} />
      {ESTRELAS.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={COR.estrela}
          className={i % 3 === 0 ? "ilu-brilhar" : undefined}
          style={i % 3 === 0 ? { animationDelay: `${(i % 5) * 0.4}s` } : undefined}
          opacity={i % 3 === 0 ? undefined : 0.7}
        />
      ))}
    </g>
  );
}

/** Céu de dia na Terra (Geografia/História no bairro). */
export function CeuDeDia() {
  const id = useId();

  return (
    <g>
      <defs>
        <linearGradient id={`dia${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#bae6fd" />
        </linearGradient>
      </defs>
      <rect width={LARGURA} height={ALTURA} fill={`url(#dia${id})`} />
      <circle cx={338} cy={62} r={24} fill={COR.amarelo} />
      <circle cx={338} cy={62} r={34} fill={COR.amarelo} opacity={0.25} className="ilu-brilhar" />
      <Nuvem x={90} y={60} />
      <Nuvem x={230} y={44} escala={0.8} />
    </g>
  );
}

export function Nuvem({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} fill="#ffffff" opacity={0.9}>
      <ellipse cx={0} cy={0} rx={26} ry={12} />
      <ellipse cx={-16} cy={4} rx={16} ry={10} />
      <ellipse cx={18} cy={4} rx={18} ry={10} />
    </g>
  );
}

/** Lua grande no céu. */
export function Lua({ x, y, r = 28 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 10} fill={COR.luaClara} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={COR.luaClara} />
      <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.22} fill={COR.lua} />
      <circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.15} fill={COR.lua} />
    </g>
  );
}

/** Chão da lua com crateras, a partir de `y` até o fim do quadro. */
export function ChaoLunar({ y = 250 }: { y?: number }) {
  return (
    <g>
      <path d={`M0 ${y + 6} C80 ${y - 8} 160 ${y + 10} 240 ${y} C300 ${y - 6} 360 ${y + 4} 400 ${y - 2} L400 300 L0 300 Z`} fill={COR.lua} />
      <ellipse cx={70} cy={y + 24} rx={22} ry={5} fill={COR.luaCratera} />
      <ellipse cx={250} cy={y + 32} rx={30} ry={6} fill={COR.luaCratera} />
      <ellipse cx={360} cy={y + 20} rx={16} ry={4} fill={COR.luaCratera} />
    </g>
  );
}

/** Chão de grama (Terra). */
export function ChaoGrama({ y = 250 }: { y?: number }) {
  return (
    <g>
      <rect x={0} y={y} width={LARGURA} height={ALTURA - y} fill={COR.verdeEscuro} />
      <path d={`M0 ${y} C100 ${y - 6} 300 ${y - 6} 400 ${y} L400 ${y + 8} L0 ${y + 8} Z`} fill={COR.verde} />
    </g>
  );
}

/** Parede de dentro (oficina, sala de comando), com chão. */
export function Interior({ chao = 250 }: { chao?: number }) {
  return (
    <g>
      <rect width={LARGURA} height={ALTURA} fill={COR.ceu2} />
      {[60, 150, 240, 330].map((x) => (
        <rect key={x} x={x} y={0} width={4} height={chao} fill={COR.ceu3} opacity={0.6} />
      ))}
      <rect x={0} y={chao} width={LARGURA} height={ALTURA - chao} fill={COR.ceu3} />
      <rect x={0} y={chao} width={LARGURA} height={5} fill={COR.violetaEscuro} opacity={0.6} />
    </g>
  );
}

/** Engrenagem de enfeite (oficina). */
export function Engrenagem({ x, y, r = 14, cor = COR.metalEscuro }: { x: number; y: number; r?: number; cor?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={cor} strokeWidth={r * 0.45} strokeDasharray={`${r * 0.5} ${r * 0.35}`} />
      <circle cx={x} cy={y} r={r * 0.75} fill={cor} />
      <circle cx={x} cy={y} r={r * 0.3} fill={COR.ceu2} />
    </g>
  );
}

// ---------------------------------------------------------------- Planeta Cubo

export type TipoBloco = "grama" | "terra" | "pedra" | "cristal" | "lava";

const CORES_BLOCO: Record<TipoBloco, { base: string; escuro: string; topo?: string }> = {
  grama: { base: COR.terra, escuro: COR.terraEscura, topo: COR.verde },
  terra: { base: COR.terra, escuro: COR.terraEscura },
  pedra: { base: COR.pedra, escuro: COR.pedraEscura },
  cristal: { base: "#67e8f9", escuro: COR.cianoEscuro },
  lava: { base: COR.laranja, escuro: "#c2410c" },
};

/** Um bloco do Planeta Cubo (quadrado com textura de pixels). */
export function Bloco({ x, y, tam = 30, tipo = "grama" }: { x: number; y: number; tam?: number; tipo?: TipoBloco }) {
  const c = CORES_BLOCO[tipo];
  const p = tam / 6;

  return (
    <g>
      <rect x={x} y={y} width={tam} height={tam} fill={c.base} stroke={COR.contorno} strokeWidth={1.5} />
      <rect x={x + p} y={y + p * 3} width={p} height={p} fill={c.escuro} />
      <rect x={x + p * 4} y={y + p * 2} width={p} height={p} fill={c.escuro} />
      <rect x={x + p * 3} y={y + p * 4.5} width={p} height={p} fill={c.escuro} />
      {c.topo && (
        <path
          d={`M${x} ${y} h${tam} v${p * 1.6} h-${p} v${p * 0.6} h-${p} v-${p * 0.6} h-${p * 2} v${p} h-${p} v-${p} h-${p} Z`}
          fill={c.topo}
        />
      )}
      {tipo === "cristal" && <path d={`M${x + p} ${y + p} l${p} ${p} M${x + p * 3.5} ${y + p} l${p} ${p * 1.5}`} stroke="#ffffff" strokeWidth={1.5} opacity={0.7} />}
    </g>
  );
}

/** Pilha vertical de blocos (dezena), de baixo para cima a partir de (x, yChao). */
export function Pilha({ x, yChao, quantos, tam = 20, tipo = "pedra" }: { x: number; yChao: number; quantos: number; tam?: number; tipo?: TipoBloco }) {
  return (
    <g>
      {Array.from({ length: quantos }, (_, i) => (
        <Bloco key={i} x={x} y={yChao - (i + 1) * tam} tam={tam} tipo={tipo} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- objetos

/** Plaquinha com um número ou letra (etiqueta de contagem). */
export function Etiqueta({ x, y, texto, cor = COR.amarelo }: { x: number; y: number; texto: string; cor?: string }) {
  const largura = Math.max(34, texto.length * 16 + 14);

  return (
    <g>
      <rect x={x - largura / 2} y={y - 18} width={largura} height={36} rx={12} fill={cor} stroke={COR.contorno} strokeWidth={2.5} />
      <text x={x} y={y + 8} textAnchor="middle" fontSize={24} fontWeight={900} fill={COR.contorno}>
        {texto}
      </text>
    </g>
  );
}

/** Uma letra solta num quadradinho (as letras que a Gosma come). */
export function Letra({ x, y, letra, giro = 0, classe }: { x: number; y: number; letra: string; giro?: number; classe?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <g className={classe}>
        <rect x={-13} y={-13} width={26} height={26} rx={6} fill={COR.branco} stroke={COR.contorno} strokeWidth={2} />
        <text x={0} y={8} textAnchor="middle" fontSize={20} fontWeight={900} fill={COR.violetaEscuro}>
          {letra}
        </text>
      </g>
    </g>
  );
}

/** Antena alta de base lunar, do chão até `topo`. */
export function Antena({ x, chao, topo }: { x: number; chao: number; topo: number }) {
  const meio = (chao + topo) / 2;

  return (
    <g>
      <path d={`M${x - 22} ${chao} L${x} ${topo} L${x + 22} ${chao}`} stroke={COR.metalEscuro} strokeWidth={4} fill="none" strokeLinejoin="round" />
      <line x1={x - 14} y1={meio + 30} x2={x + 14} y2={meio + 30} stroke={COR.metalEscuro} strokeWidth={3} />
      <line x1={x - 8} y1={meio - 20} x2={x + 8} y2={meio - 20} stroke={COR.metalEscuro} strokeWidth={3} />
      <circle cx={x} cy={topo} r={6} fill={COR.vermelho} className="ilu-brilhar" />
    </g>
  );
}

/** Caixa de suprimentos com um símbolo (gota = água, maçã = comida). */
export function Caixa({ x, y, tam = 36, simbolo }: { x: number; y: number; tam?: number; simbolo: "agua" | "comida" }) {
  const cx = x + tam / 2;
  const cy = y + tam / 2 + 2;

  return (
    <g>
      <rect x={x} y={y} width={tam} height={tam} rx={5} fill="#d6a468" stroke={COR.contorno} strokeWidth={2} />
      <rect x={x} y={y + tam * 0.18} width={tam} height={4} fill="#b7834a" />
      {simbolo === "agua" ? (
        <path d={`M${cx} ${cy - 10} C${cx - 8} ${cy} ${cx - 7} ${cy + 8} ${cx} ${cy + 8} C${cx + 7} ${cy + 8} ${cx + 8} ${cy} ${cx} ${cy - 10} Z`} fill={COR.ciano} stroke={COR.contorno} strokeWidth={1.5} />
      ) : (
        <g>
          <circle cx={cx} cy={cy + 1} r={8} fill={COR.vermelho} stroke={COR.contorno} strokeWidth={1.5} />
          <path d={`M${cx} ${cy - 7} q3 -5 7 -5`} stroke={COR.verdeEscuro} strokeWidth={2.5} fill="none" />
        </g>
      )}
    </g>
  );
}

/** Casa simples (Terra). */
export function Casa({ x, y, cor = "#fca5a5", escala = 1 }: { x: number; y: number; cor?: string; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x={-40} y={-56} width={80} height={56} fill={cor} stroke={COR.contorno} strokeWidth={2.5} />
      <path d="M-50 -54 L0 -92 L50 -54 Z" fill={COR.vermelhoEscuro} stroke={COR.contorno} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={-10} y={-32} width={20} height={32} rx={3} fill={COR.terra} stroke={COR.contorno} strokeWidth={2} />
      <circle cx={5} cy={-16} r={2} fill={COR.amarelo} />
      <rect x={-33} y={-44} width={16} height={14} fill="#bae6fd" stroke={COR.contorno} strokeWidth={2} />
      <rect x={17} y={-44} width={16} height={14} fill="#bae6fd" stroke={COR.contorno} strokeWidth={2} />
    </g>
  );
}

/** Árvore (Terra). */
export function Arvore({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x={-5} y={-30} width={10} height={30} fill={COR.terra} stroke={COR.contorno} strokeWidth={2} />
      <circle cx={0} cy={-46} r={24} fill={COR.verde} stroke={COR.contorno} strokeWidth={2} />
      <circle cx={-9} cy={-52} r={6} fill="#86efac" />
    </g>
  );
}

/** Página solta do diário de bordo, com um desenho dentro. */
export function Pagina({ x, y, giro = 0, children, classe }: { x: number; y: number; giro?: number; children?: ReactNode; classe?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <g className={classe}>
        <rect x={-26} y={-32} width={52} height={64} rx={4} fill="#fef3c7" stroke={COR.contorno} strokeWidth={2} />
        <line x1={-18} y1={18} x2={18} y2={18} stroke="#d6a468" strokeWidth={2} />
        <line x1={-18} y1={24} x2={10} y2={24} stroke="#d6a468" strokeWidth={2} />
        {children}
      </g>
    </g>
  );
}

/** Solzinho e luazinha para desenhar dentro das páginas. */
export function Sol({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;

        return <line key={a} x1={x + Math.cos(rad) * (r + 3)} y1={y + Math.sin(rad) * (r + 3)} x2={x + Math.cos(rad) * (r + 7)} y2={y + Math.sin(rad) * (r + 7)} stroke={COR.laranja} strokeWidth={2.5} strokeLinecap="round" />;
      })}
      <circle cx={x} cy={y} r={r} fill={COR.amarelo} stroke={COR.laranja} strokeWidth={1.5} />
    </g>
  );
}

export function LuaMinguante({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return <path d={`M${x + r * 0.2} ${y - r} A${r} ${r} 0 1 0 ${x + r * 0.2} ${y + r} A${r * 0.75} ${r * 0.75} 0 1 1 ${x + r * 0.2} ${y - r} Z`} fill={COR.amarelo} stroke={COR.laranja} strokeWidth={1.5} />;
}
