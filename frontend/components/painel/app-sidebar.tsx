"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { NavMain } from "@/components/painel/nav-main";
import { NavUser } from "@/components/painel/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { PAINEL_HOME_ROUTE, getPainelNavForRole } from "@/lib/painel-access";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const navItems = React.useMemo(() => {
    if (!user) {
      return [];
    }

    return getPainelNavForRole(user.role);
  }, [user]);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={PAINEL_HOME_ROUTE}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpenText className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-extrabold tracking-tight">
                    Teia de Palavras
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Painel do educador
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
