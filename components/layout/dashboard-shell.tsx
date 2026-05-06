import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { NavigationItem } from "@/lib/navigation";

type DashboardShellProps = {
  children: ReactNode;
  userName?: string | null;
  unreadNotifications: number;
  navigationItems: NavigationItem[];
  pushPublicKey?: string;
};

export function DashboardShell({
  children,
  userName,
  unreadNotifications,
  navigationItems,
  pushPublicKey
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-80 flex-col border-r border-border bg-card px-5 py-6 lg:flex">
        <div className="mb-8 shrink-0">
          <p className="text-sm font-semibold tracking-[0.24em] text-primary">
            TUPSA
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">
            Gestão da Casa
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estudos, pontos e comunicados respeitando papéis e grupos.
          </p>
        </div>
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          <SidebarNav items={navigationItems} />
        </div>
      </aside>
      <div className="lg:pl-80">
        <DashboardHeader
          navigationItems={navigationItems}
          pushPublicKey={pushPublicKey}
          unreadNotifications={unreadNotifications}
          userName={userName}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
