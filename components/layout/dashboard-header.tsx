import { Bell } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@/lib/navigation";

type DashboardHeaderProps = {
  userName?: string | null;
  unreadNotifications: number;
  navigationItems: NavigationItem[];
};

export function DashboardHeader({
  userName,
  unreadNotifications,
  navigationItems
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MobileSidebar items={navigationItems} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Sistema interno
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {userName ? `Olá, ${userName}` : "Dashboard"}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/dashboard/notificacoes">
            <Badge className="hidden gap-2 bg-card text-foreground transition hover:bg-muted sm:inline-flex">
              <Bell className="size-3.5" aria-hidden="true" />
              {unreadNotifications} não lidas
            </Badge>
          </Link>
          <form action={logoutAction}>
            <Button size="sm" type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
