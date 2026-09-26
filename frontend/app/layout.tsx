import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { AppToaster } from "@/components/ui/app-toaster";

import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Teia de Palavras",
  description: "Teia de Palavras — portal de alfabetização infantil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="pt-BR">
      <body className={`${nunito.variable} h-full font-sans antialiased`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
