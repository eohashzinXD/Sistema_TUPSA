"use client";

import {
  Bell,
  BookOpenText,
  CalendarDays,
  CalendarClock,
  Droplets,
  FolderTree,
  Home,
  Megaphone,
  Music2,
  Settings,
  Users,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationIcon, NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  items: NavigationItem[];
  onNavigate?: () => void;
};

const navigationIcons: Record<NavigationIcon, typeof Home> = {
  bell: Bell,
  book: BookOpenText,
  calendar: CalendarClock,
  "calendar-days": CalendarDays,
  droplets: Droplets,
  folder: FolderTree,
  home: Home,
  megaphone: Megaphone,
  music: Music2,
  settings: Settings,
  users: Users,
  wallet: WalletCards
};

function isRouteMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const activeHref = items
    .filter((item) => isRouteMatch(pathname, item.href))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;

  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const Icon = navigationIcons[item.icon];
        const active = activeHref === item.href;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-start gap-3 rounded-2xl px-3 py-3 text-sm transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="block font-semibold">{item.title}</span>
              <span
                className={cn(
                  "mt-0.5 block text-xs leading-5",
                  active ? "text-primary-foreground/75" : "text-muted-foreground"
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
