import { PulsoSessao } from "@/components/crianca/pausa/pulso-sessao";
import { CriancaProvider } from "@/context/CriancaContext";

/** Área da criança já identificada: perfil carregado + batimento de sessão/pausa. */
export default function AreaCriancaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CriancaProvider>
      {children}
      <PulsoSessao />
    </CriancaProvider>
  );
}
