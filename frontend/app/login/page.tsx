import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar — Teia de Palavras",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center bg-[linear-gradient(180deg,_oklch(0.99_0.005_80)_0%,_oklch(0.96_0.012_80)_100%)] px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <LoginForm className="w-full" />
      </div>
    </div>
  );
}
