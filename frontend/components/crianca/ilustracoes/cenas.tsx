import type { ComponentType } from "react";

import type { ChaveIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import { rotuloIlustracao } from "@/components/crianca/ilustracoes/catalogo";
import {
  Antena,
  Arvore,
  Bloco,
  Caixa,
  Casa,
  Cena,
  CeuDeDia,
  CeuEstrelado,
  ChaoGrama,
  ChaoLunar,
  Engrenagem,
  Etiqueta,
  Interior,
  Letra,
  Lua,
  LuaMinguante,
  Pagina,
  Pilha,
  Sol,
} from "@/components/crianca/ilustracoes/elementos";
import { COR } from "@/components/crianca/ilustracoes/paleta";
import { BonecaRobo, Bone, Capitao, Gosma, Mascote, NaveTeia, RoboTatu } from "@/components/crianca/ilustracoes/personagens";

/**
 * As cenas da Temporada 1 (catálogo em catalogo.ts). Carregadas sob demanda:
 * só o app da criança e a miniatura do painel importam este módulo.
 */

function titulo(chave: ChaveIlustracao): string {
  return rotuloIlustracao(chave) ?? "Ilustração";
}

/** Fios de teia entre dois pontos, com travessas (a teia da nave). */
function FiosDeTeia({ de, ate }: { de: [number, number]; ate: [number, number] }) {
  const [x1, y1] = de;
  const [x2, y2] = ate;
  const fios = [-14, 0, 14].map((d) => `M${x1} ${y1} Q${(x1 + x2) / 2 + d} ${(y1 + y2) / 2 - 10 + d} ${x2 + d * 1.5} ${y2}`);
  const travessas = [0.3, 0.5, 0.7].map((t) => {
    const ax = x1 + (x2 - x1) * t;
    const ay = y1 + (y2 - y1) * t;

    return `M${ax - 16 * t} ${ay - 6} Q${ax} ${ay + 4} ${ax + 16 * t + 6} ${ay - 2}`;
  });

  return (
    <g stroke={COR.violeta} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.95}>
      {fios.map((d) => (
        <path key={d} d={d} />
      ))}
      {travessas.map((d) => (
        <path key={d} d={d} strokeWidth={1.8} />
      ))}
    </g>
  );
}

// ------------------------------------------------------------------ capas

function CapaTeia() {
  return (
    <Cena titulo={titulo("capa-teia")}>
      <CeuEstrelado />
      <Lua x={330} y={62} r={20} />
      {/* estação com antena no teto */}
      <rect x={200} y={196} width={170} height={110} rx={8} fill={COR.metalEscuro} stroke={COR.contorno} strokeWidth={2.5} />
      <rect x={200} y={196} width={170} height={10} fill={COR.metal} />
      {[222, 262, 302, 342].map((x) => (
        <rect key={x} x={x - 10} y={222} width={20} height={16} rx={4} fill={COR.amarelo} opacity={0.85} />
      ))}
      <line x1={340} y1={196} x2={340} y2={160} stroke={COR.metal} strokeWidth={3} />
      <circle cx={340} cy={156} r={5} fill={COR.vermelho} className="ilu-brilhar" />
      <ChaoLunar y={262} />
      <FiosDeTeia de={[142, 108]} ate={[262, 190]} />
      <NaveTeia x={128} y={92} escala={0.95} />
      <RoboTatu x={288} y={196} escala={0.85} />
    </Cena>
  );
}

function CapaBoneca() {
  return (
    <Cena titulo={titulo("capa-boneca")}>
      <Interior chao={236} />
      <rect x={60} y={96} width={90} height={8} rx={3} fill={COR.metalEscuro} />
      <rect x={250} y={80} width={90} height={8} rx={3} fill={COR.metalEscuro} />
      <Engrenagem x={82} y={80} r={13} />
      <Engrenagem x={116} y={84} r={9} cor={COR.violetaEscuro} />
      <Engrenagem x={300} y={62} r={15} />
      <circle cx={200} cy={170} r={86} fill={COR.rosa} opacity={0.12} />
      <BonecaRobo x={200} y={250} escala={2.1} pose="feliz" />
      {[
        [120, 150],
        [290, 140],
        [256, 206],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z`} fill={COR.amarelo} className="ilu-brilhar" />
      ))}
    </Cena>
  );
}

function CapaSomar() {
  return (
    <Cena titulo={titulo("capa-somar")}>
      <CeuEstrelado />
      <ChaoLunar y={248} />
      {/* foguete */}
      <g transform="translate(318 250)">
        <path d="M-22 -30 L-40 0 L-22 -6 Z" fill={COR.vermelhoEscuro} stroke={COR.contorno} strokeWidth={2} />
        <path d="M22 -30 L40 0 L22 -6 Z" fill={COR.vermelhoEscuro} stroke={COR.contorno} strokeWidth={2} />
        <path d="M-22 0 L-22 -110 C-22 -140 0 -160 0 -160 C0 -160 22 -140 22 -110 L22 0 Z" fill={COR.branco} stroke={COR.contorno} strokeWidth={2.5} />
        <circle cx={0} cy={-100} r={11} fill={COR.ciano} stroke={COR.contorno} strokeWidth={2.5} />
        <path d="M-22 -128 C-14 -150 14 -150 22 -128 Z" fill={COR.vermelho} />
      </g>
      {/* 4 caixas de água + 3 de comida */}
      <Caixa x={60} y={212} simbolo="agua" />
      <Caixa x={98} y={212} simbolo="agua" />
      <Caixa x={60} y={174} simbolo="agua" />
      <Caixa x={98} y={174} simbolo="agua" />
      <Caixa x={160} y={212} simbolo="comida" />
      <Caixa x={198} y={212} simbolo="comida" />
      <Caixa x={179} y={174} simbolo="comida" />
      <Mascote x={250} y={250} escala={0.85} pose="feliz" />
    </Cena>
  );
}

function CapaCasa() {
  return (
    <Cena titulo={titulo("capa-casa")}>
      <CeuDeDia />
      <ChaoGrama y={226} />
      <rect x={0} y={252} width={400} height={26} fill="#64748b" />
      {[30, 110, 190, 270, 350].map((x) => (
        <rect key={x} x={x} y={263} width={34} height={4} fill="#f8fafc" />
      ))}
      <Arvore x={70} y={228} />
      <Casa x={200} y={228} />
      <NaveTeia x={330} y={186} escala={0.55} />
      <Capitao x={276} y={250} escala={0.8} pose="acenando" />
    </Cena>
  );
}

// ------------------------------------------------------------ Português

function BonecaOficina() {
  return (
    <Cena titulo={titulo("boneca-oficina")}>
      <CeuEstrelado />
      <Lua x={318} y={66} r={30} />
      <ChaoLunar y={250} />
      <rect x={80} y={150} width={180} height={110} fill={COR.metalEscuro} stroke={COR.contorno} strokeWidth={2.5} />
      <path d="M70 152 L170 100 L270 152 Z" fill={COR.violetaEscuro} stroke={COR.contorno} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={110} y={180} width={42} height={34} rx={4} fill={COR.amarelo} className="ilu-brilhar" />
      <rect x={110} y={180} width={42} height={34} rx={4} fill="none" stroke={COR.contorno} strokeWidth={2.5} />
      <rect x={190} y={200} width={36} height={60} rx={4} fill={COR.ceu2} stroke={COR.contorno} strokeWidth={2.5} />
      <Engrenagem x={170} y={130} r={10} cor={COR.metal} />
      <Capitao x={318} y={262} escala={0.72} espelhar />
    </Cena>
  );
}

function BonecaSozinha() {
  return (
    <Cena titulo={titulo("boneca-sozinha")}>
      <Interior chao={240} />
      <path d="M200 0 L120 250 L280 250 Z" fill={COR.amarelo} opacity={0.1} />
      <ellipse cx={200} cy={250} rx={80} ry={10} fill={COR.amarelo} opacity={0.15} />
      <rect x={292} y={206} width={54} height={34} rx={4} fill={COR.vermelhoEscuro} stroke={COR.contorno} strokeWidth={2} />
      <rect x={304} y={198} width={30} height={10} rx={3} fill="none" stroke={COR.contorno} strokeWidth={3} />
      <Engrenagem x={80} y={214} r={16} />
      <BonecaRobo x={200} y={246} escala={2} pose="triste" bone={false} />
    </Cena>
  );
}

function BonecaBone() {
  return (
    <Cena titulo={titulo("boneca-bone")}>
      <Interior chao={240} />
      {/* cano e cubo de metal */}
      <rect x={30} y={150} width={140} height={18} rx={6} fill={COR.metalEscuro} stroke={COR.contorno} strokeWidth={2} />
      <rect x={60} y={180} width={60} height={60} rx={6} fill={COR.metal} stroke={COR.contorno} strokeWidth={2.5} />
      {[
        [68, 188],
        [112, 188],
        [68, 232],
        [112, 232],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.5} fill={COR.metalEscuro} />
      ))}
      <Capitao x={160} y={252} escala={0.9} pose="segurando" />
      <Bone x={194} y={196} escala={0.9} />
      <BonecaRobo x={268} y={252} escala={1.6} pose="feliz" bone={false} />
      {/* uma gosma preta no canto... */}
      <Gosma x={340} y={250} escala={0.8} pose="espiando" />
    </Cena>
  );
}

function GosmaAparece() {
  return (
    <Cena titulo={titulo("gosma-aparece")}>
      <CeuEstrelado />
      <ChaoLunar y={250} />
      {/* placa da base: sobraram B e A */}
      <rect x={196} y={112} width={8} height={140} fill={COR.metalEscuro} />
      <rect x={322} y={112} width={8} height={140} fill={COR.metalEscuro} />
      <rect x={180} y={100} width={166} height={58} rx={10} fill={COR.metal} stroke={COR.contorno} strokeWidth={2.5} />
      <Letra x={204} y={129} letra="B" />
      <Letra x={242} y={129} letra="A" />
      <rect x={267} y={116} width={26} height={26} rx={6} fill={COR.metalEscuro} opacity={0.6} />
      <rect x={305} y={116} width={26} height={26} rx={6} fill={COR.metalEscuro} opacity={0.6} />
      {/* as letras voando para a boca */}
      <Letra x={176} y={186} letra="S" giro={-20} classe="ilu-flutuar" />
      <Letra x={150} y={160} letra="E" giro={18} classe="ilu-flutuar" />
      <Gosma x={110} y={258} escala={1.3} pose="comendo" />
      <Mascote x={300} y={256} escala={0.9} pose="surpreso" />
    </Cena>
  );
}

function GosmaArroto() {
  return (
    <Cena titulo={titulo("gosma-arroto")}>
      <CeuEstrelado />
      <ChaoLunar y={250} />
      <Antena x={300} chao={256} topo={58} />
      <Letra x={276} y={70} letra="B" giro={-12} classe="ilu-flutuar" />
      <Letra x={322} y={80} letra="A" giro={10} classe="ilu-flutuar" />
      <Letra x={286} y={104} letra="S" giro={16} classe="ilu-flutuar" />
      <Letra x={318} y={118} letra="E" giro={-8} classe="ilu-flutuar" />
      <g stroke={COR.violeta} strokeWidth={2} strokeDasharray="4 6" fill="none" opacity={0.8}>
        <path d="M150 196 Q200 110 262 88" />
        <path d="M156 206 Q220 150 272 124" />
      </g>
      <Gosma x={120} y={258} escala={1.25} pose="arroto" />
    </Cena>
  );
}

function BipPulo() {
  return (
    <Cena titulo={titulo("bip-pulo")}>
      <CeuEstrelado />
      <ChaoLunar y={250} />
      <Antena x={316} chao={256} topo={62} />
      <Letra x={296} y={82} letra="B" giro={-12} />
      <Letra x={338} y={92} letra="A" giro={10} />
      <path d="M110 250 Q160 60 238 118" stroke={COR.amarelo} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" fill="none" />
      <Mascote x={232} y={150} escala={1.05} pose="voando" />
      <Capitao x={80} y={258} escala={0.7} pose="acenando" />
    </Cena>
  );
}

// ------------------------------------------------------------ Matemática

function CeuDoCubo() {
  return (
    <g>
      <CeuEstrelado claro />
      {/* o Planeta Cubo, lá longe */}
      <g transform="translate(330 58) rotate(12)" opacity={0.85}>
        <rect x={-18} y={-18} width={36} height={36} rx={4} fill={COR.verde} stroke={COR.contorno} strokeWidth={2} />
        <rect x={-18} y={0} width={36} height={18} fill={COR.terra} />
      </g>
    </g>
  );
}

function CuboPonte() {
  const tam = 30;

  return (
    <Cena titulo={titulo("cubo-ponte")}>
      <CeuDoCubo />
      {/* lava no fundo do buraco */}
      <rect x={150} y={262} width={110} height={40} fill={COR.laranja} />
      <path d="M150 262 q14 -8 28 0 t28 0 t28 0 t28 0 v8 h-112 Z" fill={COR.amarelo} className="ilu-brilhar" />
      {/* barranco da esquerda e da direita */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={`e${i}`}>
          <Bloco x={i * tam} y={210} tam={tam} tipo="grama" />
          <Bloco x={i * tam} y={240} tam={tam} tipo="terra" />
          <Bloco x={i * tam} y={270} tam={tam} tipo="pedra" />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={`d${i}`}>
          <Bloco x={260 + i * tam} y={210} tam={tam} tipo="grama" />
          <Bloco x={260 + i * tam} y={240} tam={tam} tipo="terra" />
          <Bloco x={260 + i * tam} y={270} tam={tam} tipo="pedra" />
        </g>
      ))}
      {/* o que sobrou da ponte */}
      <Bloco x={150} y={210} tam={tam} tipo="pedra" />
      <Bloco x={230} y={210} tam={tam} tipo="pedra" />
      <Mascote x={70} y={210} escala={0.8} pose="surpreso" />
      <Capitao x={112} y={210} escala={0.62} />
      <Gosma x={320} y={212} escala={0.85} pose="cheia" />
    </Cena>
  );
}

function CuboPilhas() {
  return (
    <Cena titulo={titulo("cubo-pilhas")}>
      <CeuDoCubo />
      <rect x={0} y={250} width={400} height={50} fill={COR.terraEscura} />
      <rect x={0} y={250} width={400} height={8} fill={COR.verde} />
      {/* uma pilha de 10 */}
      <Pilha x={128} yChao={250} quantos={10} tam={20} tipo="pedra" />
      <Etiqueta x={98} y={148} texto="10" />
      {/* 3 soltos */}
      <Bloco x={206} y={230} tam={20} tipo="pedra" />
      <Bloco x={232} y={230} tam={20} tipo="pedra" />
      <Bloco x={258} y={230} tam={20} tipo="pedra" />
      <Etiqueta x={242} y={202} texto="3" cor={COR.ciano} />
      <Mascote x={316} y={252} escala={0.85} pose="pensando" />
    </Cena>
  );
}

// ------------------------------------------------------------ Geografia

function MapaBairro() {
  return (
    <Cena titulo={titulo("mapa-bairro")}>
      <CeuEstrelado />
      {/* a folha do mapa */}
      <g transform="rotate(-3 200 150)">
        <rect x={42} y={40} width={316} height={220} rx={10} fill="#fef3c7" stroke={COR.contorno} strokeWidth={3} />
        {/* rio */}
        <path d="M42 214 C110 196 160 238 230 220 C290 206 320 232 358 222" stroke="#60a5fa" strokeWidth={14} fill="none" />
        {/* ruas */}
        <g stroke="#94a3b8" strokeWidth={12} strokeLinecap="round">
          <line x1={60} y1={116} x2={340} y2={116} />
          <line x1={196} y1={56} x2={196} y2={196} />
        </g>
        {/* casas (quadradinhos) */}
        {[
          [70, 66, "#fca5a5"],
          [112, 66, "#fdba74"],
          [70, 136, "#c4b5fd"],
          [112, 136, "#93c5fd"],
          [226, 136, "#fca5a5"],
          [268, 136, "#fdba74"],
        ].map(([x, y, cor]) => (
          <rect key={`${x}-${y}`} x={Number(x)} y={Number(y)} width={30} height={30} rx={3} fill={String(cor)} stroke={COR.contorno} strokeWidth={2} />
        ))}
        {/* escola com bandeira */}
        <rect x={222} y={60} width={62} height={40} rx={3} fill="#fde68a" stroke={COR.contorno} strokeWidth={2} />
        <line x1={292} y1={100} x2={292} y2={62} stroke={COR.contorno} strokeWidth={2} />
        <path d="M292 62 L310 68 L292 74 Z" fill={COR.vermelho} />
        {/* praça */}
        <circle cx={316} cy={160} r={22} fill={COR.verde} stroke={COR.contorno} strokeWidth={2} />
        <circle cx={310} cy={156} r={6} fill={COR.verdeEscuro} />
        <circle cx={324} cy={166} r={5} fill={COR.verdeEscuro} />
        {/* rastro de gosma até a praça */}
        {[
          [90, 104],
          [120, 110],
          [150, 104],
          [180, 110],
          [212, 124],
          [238, 118],
          [266, 124],
          [290, 134],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={6} ry={4} fill={COR.gosma} opacity={0.85} />
        ))}
        {/* olhinhos do mascote atrás da árvore da praça */}
        <g className="ilu-piscar">
          <ellipse cx={330} cy={146} rx={3} ry={4} fill={COR.ciano} />
          <ellipse cx={339} cy={146} rx={3} ry={4} fill={COR.ciano} />
        </g>
      </g>
      <Etiqueta x={330} y={100} texto="?" cor={COR.rosa} />
    </Cena>
  );
}

// ------------------------------------------------------------ História

function DiarioEspirro() {
  return (
    <Cena titulo={titulo("diario-espirro")}>
      <Interior chao={236} />
      {/* mesa com o diário aberto */}
      <rect x={230} y={200} width={140} height={10} rx={3} fill={COR.terra} />
      <rect x={244} y={210} width={8} height={30} fill={COR.terraEscura} />
      <rect x={348} y={210} width={8} height={30} fill={COR.terraEscura} />
      <path d="M252 198 L298 190 L344 198 L344 172 L298 164 L252 172 Z" fill="#fef3c7" stroke={COR.contorno} strokeWidth={2} />
      <line x1={298} y1={164} x2={298} y2={190} stroke={COR.contorno} strokeWidth={2} />
      {/* páginas voando */}
      <Pagina x={210} y={96} giro={-18} classe="ilu-flutuar">
        <Sol x={0} y={-8} r={9} />
      </Pagina>
      <Pagina x={292} y={72} giro={14} classe="ilu-flutuar">
        <LuaMinguante x={0} y={-8} r={10} />
      </Pagina>
      <Pagina x={346} y={132} giro={-8} classe="ilu-flutuar">
        <Mascote x={0} y={8} escala={0.3} animar={false} />
      </Pagina>
      {/* respingos do espirro */}
      {[
        [170, 180],
        [186, 160],
        [196, 196],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill={COR.gosmaBrilho} opacity={0.8} />
      ))}
      <Gosma x={100} y={246} escala={1.2} pose="espirro" />
    </Cena>
  );
}

function DiarioTempo() {
  return (
    <Cena titulo={titulo("diario-tempo")}>
      <CeuEstrelado claro />
      {/* ontem: noite, meio apagada */}
      <g opacity={0.6}>
        <Pagina x={96} y={146}>
          <LuaMinguante x={0} y={-8} r={11} />
        </Pagina>
      </g>
      {/* hoje: o dia de agora, com o mascote */}
      <circle cx={200} cy={140} r={58} fill={COR.amarelo} opacity={0.12} />
      <g transform="translate(200 140) scale(1.3) translate(-200 -140)">
        <Pagina x={200} y={140}>
          <Sol x={-10} y={-14} r={7} />
          <Mascote x={8} y={10} escala={0.26} animar={false} pose="feliz" />
        </Pagina>
      </g>
      {/* amanhã: ainda por escrever (tracejada) */}
      <g transform="translate(304 146)">
        <rect x={-26} y={-32} width={52} height={64} rx={4} fill="none" stroke="#fef3c7" strokeWidth={2.5} strokeDasharray="6 5" />
        <path d="M-12 0 A12 12 0 0 1 12 0 Z" fill={COR.amarelo} opacity={0.8} />
        <line x1={-18} y1={0} x2={18} y2={0} stroke="#fef3c7" strokeWidth={2} />
      </g>
      {/* a flecha do tempo */}
      <g stroke={COR.ciano} strokeWidth={4} strokeLinecap="round" fill="none">
        <line x1={70} y1={236} x2={326} y2={236} />
        <path d="M314 226 L330 236 L314 246" />
      </g>
      {[96, 200, 304].map((x) => (
        <circle key={x} cx={x} cy={236} r={7} fill={x === 200 ? COR.amarelo : COR.ciano} stroke={COR.contorno} strokeWidth={2} />
      ))}
    </Cena>
  );
}

export const CENAS: Record<ChaveIlustracao, ComponentType> = {
  "capa-teia": CapaTeia,
  "capa-boneca": CapaBoneca,
  "capa-somar": CapaSomar,
  "capa-casa": CapaCasa,
  "boneca-oficina": BonecaOficina,
  "boneca-sozinha": BonecaSozinha,
  "boneca-bone": BonecaBone,
  "gosma-aparece": GosmaAparece,
  "gosma-arroto": GosmaArroto,
  "bip-pulo": BipPulo,
  "cubo-ponte": CuboPonte,
  "cubo-pilhas": CuboPilhas,
  "mapa-bairro": MapaBairro,
  "diario-espirro": DiarioEspirro,
  "diario-tempo": DiarioTempo,
};

/** Desenha a cena da chave (o chamador garante que a chave existe no catálogo). */
export function CenaPorChave({ chave }: { chave: ChaveIlustracao }) {
  const Desenho = CENAS[chave];

  return <Desenho />;
}
