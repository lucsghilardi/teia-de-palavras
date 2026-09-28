import { AvisoNivel } from "@/components/crianca/aula/aviso-nivel";
import { PulsoSessao } from "@/components/crianca/pausa/pulso-sessao";
import { CriancaProvider } from "@/context/CriancaContext";

/** Área da criança já identificada: perfil carregado + batimento de sessão/pausa + aviso de nível. */
export default function AreaCriancaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CriancaProvider>
      {children}
      <PulsoSessao />
      <AvisoNivel />
    </CriancaProvider>
  );
}
