import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";

export const metadata: Metadata = {
  title: "Teia de Palavras",
  description: "Missões de leitura, escrita, matemática, geografia e história para crianças.",
  appleWebApp: { capable: true, title: "Teia", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

/** Lexend: desenhada para fluência de leitura; só no app da criança (o painel segue com Nunito). */
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

/** App da criança: tela cheia, tema Espaço, sem menus; instrução curta visível + alto-falante. */
export default function AppCriancaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${lexend.variable} tema-crianca min-h-dvh`}>{children}</div>;
}
