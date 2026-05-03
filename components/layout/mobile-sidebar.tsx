"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@/lib/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  items: NavigationItem[];
};

export function MobileSidebar({ items }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        aria-label="Abrir menu"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Menu className="size-4" aria-hidden="true" />
      </Button>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/35 transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col border-r border-border bg-card p-5 shadow-xl transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <BrandBlock compact />
          <Button
            onClick={() => setOpen(false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Fechar
          </Button>
        </div>
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          <SidebarNav items={items} onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className="text-sm font-semibold tracking-[0.2em] text-primary">
        TUPSA
      </p>
      {!compact ? (
        <p className="mt-1 text-xs text-muted-foreground">Gestão interna</p>
      ) : null}
    </div>
  );
}
