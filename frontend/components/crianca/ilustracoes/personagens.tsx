import type { ReactNode } from "react";

import { COR } from "@/components/crianca/ilustracoes/paleta";

/**
 * Personagens ORIGINAIS da Temporada 1 (docs/temporada-1.md), desenhados em
 * SVG. Cada um tem a origem nos pés (centro de baixo) e cresce para cima
 * (y negativo): `<Mascote x={200} y={260} />` põe o mascote em pé no chão y=260.
 * Animações são classes `ilu-*` (globals.css), sempre num <g> sem `transform`
 * próprio, e somem com "reduzir movimento".
 */

type Posicionado = { x: number; y: number; escala?: number; espelhar?: boolean };

function Posicao({ x, y, escala = 1, espelhar = false, children }: Posicionado & { children: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${espelhar ? -escala : escala} ${escala})`}>{children}</g>;
}

/** Braço de desenho animado: traço grosso com contorno e a mão redonda. */
function Braco({ de, ate, cor, mao }: { de: [number, number]; ate: [number, number]; cor: string; mao: string }) {
  return (
    <g strokeLinecap="round">
      <line x1={de[0]} y1={de[1]} x2={ate[0]} y2={ate[1]} stroke={COR.contorno} strokeWidth={10} />
      <line x1={de[0]} y1={de[1]} x2={ate[0]} y2={ate[1]} stroke={cor} strokeWidth={6.5} />
      <circle cx={ate[0]} cy={ate[1]} r={5} fill={mao} stroke={COR.contorno} strokeWidth={2} />
    </g>
  );
}

// ---------------------------------------------------------------- mascote

export type PoseMascote = "normal" | "feliz" | "surpreso" | "pensando" | "voando" | "comemorando" | "triste";

/** O robozinho `{{mascote}}` (padrão "Bip"): visor escuro, olhos ciano, antena laranja e jatos nos pés. */
export function Mascote({ pose = "normal", animar = true, ...pos }: Posicionado & { pose?: PoseMascote; animar?: boolean }) {
  const jatos = pose === "voando" || pose === "comemorando";
  const bracosAcima = pose === "voando" || pose === "comemorando" || pose === "surpreso";

  return (
    <Posicao {...pos}>
      <g className={animar && jatos ? "ilu-flutuar" : undefined}>
        {jatos && (
          <g>
            {[-7.5, 7.5].map((cx) => (
              <g key={cx} className={animar ? "ilu-chama" : undefined}>
                <path d={`M${cx - 5} 0 C${cx - 7} 9 ${cx - 3} 16 ${cx} 22 C${cx + 3} 16 ${cx + 7} 9 ${cx + 5} 0 Z`} fill={COR.laranja} />
                <path d={`M${cx - 2.5} 0 C${cx - 3} 6 ${cx - 1} 10 ${cx} 13 C${cx + 1} 10 ${cx + 3} 6 ${cx + 2.5} 0 Z`} fill={COR.amarelo} />
              </g>
            ))}
          </g>
        )}

        {/* pernas */}
        <rect x={-12} y={-13} width={9} height={13} rx={4} fill={COR.metal} stroke={COR.contorno} strokeWidth={2} />
        <rect x={3} y={-13} width={9} height={13} rx={4} fill={COR.metal} stroke={COR.contorno} strokeWidth={2} />

        {/* braços */}
        {bracosAcima ? (
          <>
            <Braco de={[-14, -30]} ate={[-27, -48]} cor={COR.branco} mao={COR.metal} />
            <Braco de={[14, -30]} ate={[27, -48]} cor={COR.branco} mao={COR.metal} />
          </>
        ) : pose === "pensando" ? (
          <>
            <Braco de={[-14, -30]} ate={[-22, -16]} cor={COR.branco} mao={COR.metal} />
            <Braco de={[14, -30]} ate={[10, -40]} cor={COR.branco} mao={COR.metal} />
          </>
        ) : (
          <>
            <Braco de={[-14, -30]} ate={[-22, -16]} cor={COR.branco} mao={COR.metal} />
            <Braco de={[14, -30]} ate={[22, -16]} cor={COR.branco} mao={COR.metal} />
          </>
        )}

        {/* corpo */}
        <rect x={-16} y={-36} width={32} height={25} rx={10} fill={COR.branco} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={0} cy={-23.5} r={4.5} fill={COR.ciano} className={animar ? "ilu-brilhar" : undefined} />

        {/* antena */}
        <line x1={0} y1={-78} x2={0} y2={-89} stroke={COR.metalEscuro} strokeWidth={3} strokeLinecap="round" />
        <circle cx={0} cy={-92} r={5} fill={COR.laranja} stroke={COR.contorno} strokeWidth={2} />

        {/* cabeça e visor */}
        <circle cx={-27} cy={-56} r={5} fill={COR.ciano} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={27} cy={-56} r={5} fill={COR.ciano} stroke={COR.contorno} strokeWidth={2} />
        <rect x={-27} y={-78} width={54} height={44} rx={19} fill={COR.branco} stroke={COR.contorno} strokeWidth={2} />
        <rect x={-21} y={-72} width={42} height={31} rx={13} fill="#0f172a" />
        <path d="M-15 -68 Q-8 -71 -2 -69" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" fill="none" />
        <OlhosMascote pose={pose} animar={animar} />
      </g>
    </Posicao>
  );
}

function OlhosMascote({ pose, animar }: { pose: PoseMascote; animar: boolean }) {
  const traco = { stroke: COR.ciano, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };

  if (pose === "feliz" || pose === "comemorando") {
    return (
      <g>
        <path d="M-14 -54 Q-9 -62 -4 -54" {...traco} />
        <path d="M4 -54 Q9 -62 14 -54" {...traco} />
      </g>
    );
  }

  if (pose === "triste") {
    return (
      <g>
        <path d="M-14 -58 Q-9 -52 -4 -58" {...traco} />
        <path d="M4 -58 Q9 -52 14 -58" {...traco} />
      </g>
    );
  }

  if (pose === "surpreso") {
    return (
      <g>
        <circle cx={-9} cy={-56} r={6.5} fill={COR.ciano} />
        <circle cx={9} cy={-56} r={6.5} fill={COR.ciano} />
        <circle cx={-7} cy={-58} r={2} fill="#ffffff" />
        <circle cx={11} cy={-58} r={2} fill="#ffffff" />
      </g>
    );
  }

  if (pose === "pensando") {
    return (
      <g>
        <ellipse cx={-9} cy={-56} rx={4.5} ry={6.5} fill={COR.ciano} />
        <path d="M4 -55 L14 -57" {...traco} />
      </g>
    );
  }

  return (
    <g className={animar ? "ilu-piscar" : undefined}>
      <ellipse cx={-9} cy={-56} rx={4.5} ry={6.5} fill={COR.ciano} />
      <ellipse cx={9} cy={-56} rx={4.5} ry={6.5} fill={COR.ciano} />
      <circle cx={-7.5} cy={-59} r={1.8} fill="#ffffff" />
      <circle cx={10.5} cy={-59} r={1.8} fill="#ffffff" />
    </g>
  );
}

// ---------------------------------------------------------------- capitão

export type PoseCapitao = "normal" | "acenando" | "lancando" | "segurando";

/** O capitão `{{heroi}}`: traje índigo com teia ciano no peito, máscara e lança-teia no pulso. */
export function Capitao({ pose = "normal", animar = true, ...pos }: Posicionado & { pose?: PoseCapitao; animar?: boolean }) {
  const direito: [number, number] =
    pose === "acenando" ? [31, -112] : pose === "lancando" ? [48, -80] : pose === "segurando" ? [36, -64] : [28, -50];

  return (
    <Posicao {...pos}>
      <g className={animar && pose === "acenando" ? "ilu-balancar" : undefined}>
        {/* botas e pernas */}
        <rect x={-15} y={-12} width={12} height={12} rx={4} fill={COR.ciano} stroke={COR.contorno} strokeWidth={2} />
        <rect x={3} y={-12} width={12} height={12} rx={4} fill={COR.ciano} stroke={COR.contorno} strokeWidth={2} />
        <rect x={-14} y={-44} width={11} height={34} rx={5} fill={COR.trajeEscuro} stroke={COR.contorno} strokeWidth={2} />
        <rect x={3} y={-44} width={11} height={34} rx={5} fill={COR.trajeEscuro} stroke={COR.contorno} strokeWidth={2} />

        {/* braços (o esquerdo sempre para baixo) */}
        <Braco de={[-18, -80]} ate={[-28, -50]} cor={COR.traje} mao={COR.pele} />
        <Braco de={[18, -80]} ate={direito} cor={COR.traje} mao={COR.pele} />
        <circle cx={direito[0]} cy={direito[1]} r={7.5} fill="none" stroke={COR.ciano} strokeWidth={3} />

        {/* tronco com a teia no peito */}
        <rect x={-21} y={-88} width={42} height={48} rx={15} fill={COR.traje} stroke={COR.contorno} strokeWidth={2} />
        <rect x={-21} y={-48} width={42} height={6} fill={COR.trajeEscuro} />
        <g stroke={COR.ciano} strokeWidth={1.8} fill="none" strokeLinecap="round">
          <circle cx={0} cy={-68} r={5} />
          <circle cx={0} cy={-68} r={10} />
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const r = (a * Math.PI) / 180;

            return <line key={a} x1={0} y1={-68} x2={13 * Math.cos(r)} y2={-68 + 13 * Math.sin(r)} />;
          })}
        </g>

        {/* cabeça */}
        <rect x={-6} y={-94} width={12} height={8} fill={COR.peleSombra} />
        <circle cx={-22} cy={-110} r={5} fill={COR.pele} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={22} cy={-110} r={5} fill={COR.pele} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={0} cy={-112} r={22} fill={COR.pele} stroke={COR.contorno} strokeWidth={2} />
        <path d="M-22 -116 C-22 -140 22 -142 22 -116 C16 -126 7 -128 0 -124 C-8 -130 -16 -126 -22 -116 Z" fill={COR.cabelo} />
        {/* máscara */}
        <path d="M-21 -114 C-10 -120 10 -120 21 -114 L21 -103 C10 -107 -10 -107 -21 -103 Z" fill={COR.ciano} stroke={COR.contorno} strokeWidth={1.5} />
        <ellipse cx={-8} cy={-110} rx={5} ry={4} fill="#ffffff" />
        <ellipse cx={8} cy={-110} rx={5} ry={4} fill="#ffffff" />
        <circle cx={-7} cy={-110} r={2} fill={COR.contorno} />
        <circle cx={9} cy={-110} r={2} fill={COR.contorno} />
        <path d="M-7 -98 Q0 -92 7 -98" stroke={COR.cabelo} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </g>
    </Posicao>
  );
}

// ---------------------------------------------------------------- gosma

export type PoseGosma = "feliz" | "comendo" | "arroto" | "espirro" | "cheia" | "espiando";

/**
 * A Gosma Comilona: bolha preta de olhos brancos e sorriso enorme. Engraçada,
 * nunca assustadora: sem dentes, olhos redondos com pupila, bochechas.
 */
export function Gosma({ pose = "feliz", animar = true, ...pos }: Posicionado & { pose?: PoseGosma; animar?: boolean }) {
  if (pose === "espiando") {
    return (
      <Posicao {...pos}>
        <ellipse cx={0} cy={-3} rx={34} ry={9} fill={COR.gosma} />
        <ellipse cx={-14} cy={-6} rx={6} ry={3} fill={COR.gosmaBrilho} opacity={0.6} />
        <g className={animar ? "ilu-piscar" : undefined}>
          <ellipse cx={-8} cy={-12} rx={6} ry={7} fill="#ffffff" />
          <ellipse cx={9} cy={-12} rx={6} ry={7} fill="#ffffff" />
          <circle cx={-6} cy={-12} r={2.5} fill={COR.gosma} />
          <circle cx={11} cy={-12} r={2.5} fill={COR.gosma} />
        </g>
      </Posicao>
    );
  }

  const cheia = pose === "cheia";

  return (
    <Posicao {...pos}>
      <g className={animar ? "ilu-respirar" : undefined}>
        <g transform={cheia ? "scale(1.18 1)" : undefined}>
          <path d="M-44 0 C-54 -18 -46 -60 -6 -68 C30 -74 54 -46 47 -14 C46 -6 42 0 36 0 Z" fill={COR.gosma} />
          {/* pingos */}
          <ellipse cx={-34} cy={2} rx={7} ry={5} fill={COR.gosma} />
          <path d="M-8 -2 C-9 8 -6 13 -3 13 C0 13 2 8 1 -2 Z" fill={COR.gosma} />
          <ellipse cx={30} cy={2} rx={8} ry={4} fill={COR.gosma} />
          {/* brilho */}
          <ellipse cx={-22} cy={-50} rx={11} ry={6} fill={COR.gosmaBrilho} opacity={0.75} transform="rotate(-28 -22 -50)" />
          <ellipse cx={-30} cy={-40} rx={3} ry={2} fill="#ffffff" opacity={0.25} />
          {cheia && (
            <g opacity={0.5}>
              <rect x={-10} y={-22} width={10} height={10} fill={COR.verde} />
              <rect x={2} y={-18} width={10} height={10} fill={COR.pedra} />
            </g>
          )}
        </g>
        <RostoGosma pose={pose} animar={animar} />
      </g>
    </Posicao>
  );
}

function RostoGosma({ pose, animar }: { pose: Exclude<PoseGosma, "espiando">; animar: boolean }) {
  const olhosFechados = pose === "espirro";
  const bocaEscura = "#7f1d1d";

  return (
    <g>
      {olhosFechados ? (
        <g stroke="#ffffff" strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M-27 -46 L-12 -40 L-27 -36" />
          <path d="M25 -48 L10 -42 L25 -38" />
        </g>
      ) : (
        <g className={animar ? "ilu-piscar" : undefined}>
          <ellipse cx={-18} cy={-44} rx={9.5} ry={12.5} fill="#ffffff" transform="rotate(18 -18 -44)" />
          <ellipse cx={15} cy={-46} rx={9.5} ry={12.5} fill="#ffffff" transform="rotate(-18 15 -46)" />
          <circle cx={-15} cy={-42} r={3.8} fill={COR.gosma} />
          <circle cx={12} cy={-44} r={3.8} fill={COR.gosma} />
        </g>
      )}

      {/* bochechas */}
      <ellipse cx={-34} cy={-24} rx={6} ry={3.5} fill={COR.rosa} opacity={0.55} />
      <ellipse cx={34} cy={-26} rx={6} ry={3.5} fill={COR.rosa} opacity={0.55} />

      {pose === "comendo" || pose === "espirro" ? (
        <g>
          <ellipse cx={0} cy={-20} rx={16} ry={13} fill={bocaEscura} />
          <ellipse cx={0} cy={-12} rx={9} ry={5} fill={COR.lingua} />
        </g>
      ) : pose === "arroto" ? (
        <g>
          <ellipse cx={2} cy={-20} rx={10} ry={8} fill={bocaEscura} />
          <g stroke={COR.violeta} strokeWidth={3} strokeLinecap="round" fill="none">
            <path d="M18 -34 Q30 -44 26 -58" />
            <path d="M26 -28 Q42 -34 44 -50" />
          </g>
        </g>
      ) : (
        <g>
          <path d="M-26 -27 Q0 2 28 -29 Q2 -16 -26 -27 Z" fill={bocaEscura} />
          <ellipse cx={2} cy={-15} rx={8} ry={3.5} fill={COR.lingua} />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------- coadjuvantes

/** A boneca-robô (Missão 2). Triste: sem boné e a boca-painel piscando. */
export function BonecaRobo({ pose = "feliz", bone = true, animar = true, ...pos }: Posicionado & { pose?: "feliz" | "triste"; bone?: boolean; animar?: boolean }) {
  const feliz = pose === "feliz";

  return (
    <Posicao {...pos}>
      <g className={animar && feliz ? "ilu-balancar" : undefined}>
        <rect x={-10} y={-12} width={7} height={12} rx={3} fill={COR.metal} stroke={COR.contorno} strokeWidth={1.5} />
        <rect x={3} y={-12} width={7} height={12} rx={3} fill={COR.metal} stroke={COR.contorno} strokeWidth={1.5} />
        <Braco de={[-9, -34]} ate={feliz ? [-20, -44] : [-16, -20]} cor={COR.gelo} mao={COR.metal} />
        <Braco de={[9, -34]} ate={feliz ? [20, -44] : [16, -20]} cor={COR.gelo} mao={COR.metal} />
        <path d="M-17 -10 L17 -10 L10 -40 L-10 -40 Z" fill={COR.rosa} stroke={COR.contorno} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={0} cy={-26} r={3} fill={COR.amarelo} />
        <circle cx={-17} cy={-62} r={5.5} fill={COR.rosa} stroke={COR.contorno} strokeWidth={1.5} />
        <circle cx={17} cy={-62} r={5.5} fill={COR.rosa} stroke={COR.contorno} strokeWidth={1.5} />
        <circle cx={0} cy={-55} r={16} fill={COR.gelo} stroke={COR.contorno} strokeWidth={2} />
        {feliz ? (
          <g stroke={COR.contorno} strokeWidth={2.5} strokeLinecap="round" fill="none">
            <path d="M-9 -57 Q-6 -61 -3 -57" />
            <path d="M3 -57 Q6 -61 9 -57" />
            <path d="M-6 -48 Q0 -43 6 -48" />
          </g>
        ) : (
          <g>
            <circle cx={-6} cy={-58} r={2.5} fill={COR.contorno} />
            <circle cx={6} cy={-58} r={2.5} fill={COR.contorno} />
            <rect x={-6} y={-49} width={12} height={4} rx={2} fill={COR.ciano} className={animar ? "ilu-brilhar" : undefined} />
          </g>
        )}
        <ellipse cx={-10} cy={-51} rx={3} ry={2} fill={COR.rosa} opacity={0.6} />
        <ellipse cx={10} cy={-51} rx={3} ry={2} fill={COR.rosa} opacity={0.6} />
        {bone && <Bone x={0} y={-66} />}
      </g>
    </Posicao>
  );
}

/** O boné vermelho da boneca (também aparece na mão do capitão). */
export function Bone({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-15 2 C-15 -14 15 -14 15 2 Z" fill={COR.vermelho} stroke={COR.contorno} strokeWidth={1.5} />
      <path d="M8 1 L27 3 C24 7 14 7 8 5 Z" fill={COR.vermelhoEscuro} stroke={COR.contorno} strokeWidth={1.5} />
      <circle cx={0} cy={-11} r={2.5} fill={COR.vermelhoEscuro} />
    </g>
  );
}

/** O robô-tatu (Missão 1): casco em gomos. */
export function RoboTatu({ animar = true, ...pos }: Posicionado & { animar?: boolean }) {
  return (
    <Posicao {...pos}>
      <g className={animar ? "ilu-respirar" : undefined}>
        <rect x={-22} y={-8} width={7} height={8} rx={2} fill={COR.metalEscuro} />
        <rect x={14} y={-8} width={7} height={8} rx={2} fill={COR.metalEscuro} />
        <path d="M-34 -4 L-44 2 L-32 2 Z" fill={COR.metalEscuro} />
        <path d="M-32 -2 C-32 -40 32 -40 32 -2 Z" fill={COR.metal} stroke={COR.contorno} strokeWidth={2} />
        {[-16, 0, 16].map((cx) => (
          <path key={cx} d={`M${cx} -30 C${cx - 4} -20 ${cx - 4} -10 ${cx} -2`} stroke={COR.metalEscuro} strokeWidth={2.5} fill="none" />
        ))}
        <circle cx={36} cy={-12} r={10} fill={COR.metal} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={39} cy={-15} r={2.5} fill={COR.contorno} />
        <circle cx={46} cy={-10} r={2} fill={COR.rosa} />
      </g>
    </Posicao>
  );
}

/** A nave Teia: casco violeta, cúpula ciano e a teia desenhada na janela. */
export function NaveTeia({ animar = true, ...pos }: Posicionado & { animar?: boolean }) {
  return (
    <Posicao {...pos}>
      <g className={animar ? "ilu-flutuar" : undefined}>
        <path d="M-50 6 L-66 22 L-38 14 Z" fill={COR.violetaEscuro} stroke={COR.contorno} strokeWidth={2} />
        <path d="M50 6 L66 22 L38 14 Z" fill={COR.violetaEscuro} stroke={COR.contorno} strokeWidth={2} />
        <ellipse cx={0} cy={6} rx={58} ry={20} fill={COR.violeta} stroke={COR.contorno} strokeWidth={2} />
        <path d="M-40 14 Q0 30 40 14" stroke={COR.violetaEscuro} strokeWidth={3} fill="none" />
        <path d="M-28 0 C-28 -30 28 -30 28 0 Z" fill={COR.ciano} fillOpacity={0.85} stroke={COR.contorno} strokeWidth={2} />
        <g stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.2} fill="none">
          <path d="M-18 0 C-18 -18 18 -18 18 0" />
          <path d="M-9 0 C-9 -10 9 -10 9 0" />
          <line x1={0} y1={0} x2={0} y2={-20} />
          <line x1={0} y1={0} x2={-18} y2={-12} />
          <line x1={0} y1={0} x2={18} y2={-12} />
        </g>
        {[-30, 0, 30].map((cx) => (
          <circle key={cx} cx={cx} cy={10} r={3.5} fill={COR.amarelo} className={animar ? "ilu-brilhar" : undefined} />
        ))}
      </g>
    </Posicao>
  );
}

/** O mascote sozinho num quadro próprio, para a interface (conquista, subir de nível). */
export function MascoteSolo({ pose = "comemorando", className, titulo }: { pose?: PoseMascote; className?: string; titulo?: string }) {
  return (
    <svg viewBox="-45 -110 90 140" className={className} role={titulo ? "img" : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true}>
      <Mascote x={0} y={pose === "voando" || pose === "comemorando" ? -4 : 20} pose={pose} />
    </svg>
  );
}
