import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Teia de Palavras",
  description: "Missões de leitura e escrita para crianças.",
  appleWebApp: { capable: true, title: "Teia", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFF7E6",
};

/** App da criança: tela cheia, cores vivas, sem menus nem texto de instrução. */
export default function AppCriancaLayout({ children }: { children: React.ReactNode }) {
  return <div className="tema-crianca min-h-dvh">{children}</div>;
}
