"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { AppSidebar } from "@/components/painel/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { rotuloBreadcrumb } from "@/lib/breadcrumbs";
import {
  PAINEL_HOME_ROUTE,
  canAccessPainelRoute,
  getPainelFallbackRoute,
} from "@/lib/painel-access";
import { ROLE_LABELS } from "@/lib/user-roles";

function PainelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Trilha a partir do segundo segmento: o primeiro ("painel") vira o link fixo.
  const segments = pathname.split("/").filter(Boolean).slice(1);

  const isAuthorized = user ? canAccessPainelRoute(user.role, pathname) : false;

  useEffect(() => {
    if (!loading && user && !isAuthorized) {
      router.replace(getPainelFallbackRoute(user.role));
    }
  }, [isAuthorized, loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Spinner />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="rounded-2xl border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
          Redirecionando para uma área permitida...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  {segments.length === 0 ? (
                    <BreadcrumbPage>Início</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={PAINEL_HOME_ROUTE}>Início</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {segments.map((segment, index) => {
                  const href = `${PAINEL_HOME_ROUTE}/${segments.slice(0, index + 1).join("/")}`;
                  const isLast = index === segments.length - 1;
                  const label = rotuloBreadcrumb(segment);

                  return (
                    <div key={href} className="flex items-center gap-3">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={href}>{label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logout()}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PainelShell>{children}</PainelShell>
    </AuthProvider>
  );
}
