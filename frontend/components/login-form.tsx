"use client";

import { useState } from "react";
import { BookOpenText, LogIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PAINEL_HOME_ROUTE } from "@/lib/painel-access";
import { appToast } from "@/lib/toast";
import { login } from "@/services/api";
import { ApiError } from "@/services/apiError";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      appToast.success("Login realizado com sucesso.");
      // Navegação completa: o proxy.ts precisa ver o cookie recém-gravado.
      window.location.assign(PAINEL_HOME_ROUTE);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Não foi possível autenticar no momento.";

      setError(message);
      appToast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-[0_28px_90px_-38px_rgba(30,27,75,0.45)]">
        <CardContent className="grid p-0 lg:grid-cols-[1fr_0.9fr]">
          <form className="p-8 lg:p-10" onSubmit={handleLogin}>
            <FieldGroup className="gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <BookOpenText className="size-5" />
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">
                    Teia de Palavras
                  </span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-center text-xl font-bold tracking-tight">
                    Entrada do educador
                  </h1>
                  <p className="text-center text-sm leading-6 text-muted-foreground">
                    Entre com seu e-mail e senha para acessar o painel.
                  </p>
                </div>
              </div>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              <FieldError>{error}</FieldError>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Entrar
                  </>
                )}
              </Button>
              <FieldDescription className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
                O cadastro de novos educadores não fica disponível nesta tela.
                Se você precisa de acesso, solicite a criação da conta a um
                administrador.
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden min-h-56 items-end overflow-hidden border-l bg-[radial-gradient(circle_at_top_left,_oklch(0.85_0.08_75_/_0.55),_transparent_45%),radial-gradient(circle_at_bottom_right,_oklch(0.75_0.12_275_/_0.35),_transparent_50%),linear-gradient(180deg,_oklch(0.97_0.02_80)_0%,_oklch(0.93_0.03_275)_100%)] p-10 lg:flex">
            <div className="space-y-3">
              <p className="text-3xl font-extrabold leading-tight text-foreground">
                Cada palavra é um fio.
                <br />
                Juntas, formam a teia.
              </p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Acompanhe as crianças, organize turmas e aulas e veja o
                progresso da alfabetização em um só lugar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
