import { ContentTargetType, ContentType } from "@prisma/client";
import {
  Bell,
  BookOpenText,
  FolderTree,
  Megaphone,
  Music2,
  Plus,
  Users
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const shortcutDefinitions = [
  {
    title: "Novo material",
    description: "Publicar estudo",
    href: "/dashboard/estudos/novo",
    permission: "study:create",
    icon: BookOpenText
  },
  {
    title: "Novo ponto",
    description: "Cadastrar ponto",
    href: "/dashboard/pontos/novo",
    permission: "points:create",
    icon: Music2
  },
  {
    title: "Enviar comunicado",
    description: "Notificar membros",
    href: "/dashboard/notificacoes/enviar",
    permission: "notifications:create",
    icon: Megaphone
  },
  {
    title: "Gerenciar usuários",
    description: "Papéis e grupos",
    href: "/dashboard/usuarios",
    permission: "users:manage",
    icon: Users
  },
  {
    title: "Categorias",
    description: "Organização interna",
    href: "/dashboard/categorias",
    permission: "categories:manage",
    icon: FolderTree
  }
];

async function getDashboardData(userId: string) {
  const [studyIds, pointIds, unreadNotifications, totalUsers] =
    await Promise.all([
      getVisibleContentIdsForUser({
        contentType: ContentType.STUDY_MATERIAL,
        userId
      }),
      getVisibleContentIdsForUser({
        contentType: ContentType.POINT,
        userId
      }),
      prisma.notificationRecipient.count({
        where: {
          userId,
          readAt: null
        }
      }),
      prisma.user.count({
        where: { active: true }
      })
    ]);

  const visibleStudyWhere = {
    OR: [
      { visibility: ContentTargetType.ALL },
      { id: { in: studyIds } }
    ]
  };
  const visiblePointWhere = {
    OR: [
      { visibility: ContentTargetType.ALL },
      { id: { in: pointIds } }
    ]
  };

  const [studyCount, pointCount, recentStudies, recentPoints, notifications] =
    await Promise.all([
      prisma.studyMaterial.count({ where: visibleStudyWhere }),
      prisma.point.count({ where: visiblePointWhere }),
      prisma.studyMaterial.findMany({
        where: visibleStudyWhere,
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          createdAt: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.point.findMany({
        where: visiblePointWhere,
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          entity: true,
          createdAt: true
        }
      }),
      prisma.notificationRecipient.findMany({
        where: { userId },
        orderBy: { notification: { createdAt: "desc" } },
        take: 4,
        select: {
          id: true,
          readAt: true,
          notification: {
            select: {
              title: true,
              createdAt: true,
              link: true
            }
          }
        }
      })
    ]);

  return {
    studyCount,
    pointCount,
    unreadNotifications,
    totalUsers,
    recentStudies,
    recentPoints,
    notifications
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const permissions = new Set(session.user.permissions);
  const data = await getDashboardData(session.user.id);
  const shortcuts = shortcutDefinitions.filter((shortcut) =>
    permissions.has(shortcut.permission)
  );
  const summaryCards = [
    {
      title: "Materiais visíveis",
      value: data.studyCount,
      description: "Estudos liberados para seu acesso.",
      icon: BookOpenText,
      href: "/dashboard/estudos",
      permission: "study:read"
    },
    {
      title: "Pontos visíveis",
      value: data.pointCount,
      description: "Pontos disponíveis conforme sua hierarquia.",
      icon: Music2,
      href: "/dashboard/pontos",
      permission: "points:read"
    },
    {
      title: "Não lidas",
      value: data.unreadNotifications,
      description: "Comunicados pendentes de leitura.",
      icon: Bell,
      href: "/dashboard/notificacoes",
      permission: "notifications:read"
    },
    {
      title: "Usuários ativos",
      value: data.totalUsers,
      description: "Membros ativos no sistema.",
      icon: Users,
      href: "/dashboard/usuarios",
      permission: "users:manage"
    }
  ].filter((card) => permissions.has(card.permission));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-primary/10" />
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Visão geral
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Central interna para estudos, pontos e comunicados da casa.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Seu painel mostra apenas conteúdos e atalhos compatíveis com suas
            permissões efetivas.
          </p>
          {shortcuts.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {shortcuts.slice(0, 3).map((shortcut) => (
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href={shortcut.href}
                  key={shortcut.href}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {shortcut.title}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link href={card.href} key={card.title}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-muted text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <p className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </p>
                <CardTitle className="mt-3">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </Card>
            </Link>
          );
        })}
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <RecentList
          emptyText="Nenhum material visível."
          items={data.recentStudies.map((item) => ({
            href: `/dashboard/estudos/${item.id}`,
            title: item.title,
            meta: `${item.category.name} · ${item.createdAt.toLocaleDateString(
              "pt-BR"
            )}`
          }))}
          title="Estudos recentes"
          visible={permissions.has("study:read")}
        />
        <RecentList
          emptyText="Nenhum ponto visível."
          items={data.recentPoints.map((item) => ({
            href: `/dashboard/pontos/${item.id}`,
            title: item.title,
            meta: `${item.entity ?? "Sem entidade"} · ${item.createdAt.toLocaleDateString(
              "pt-BR"
            )}`
          }))}
          title="Pontos recentes"
          visible={permissions.has("points:read")}
        />
        <RecentList
          emptyText="Nenhuma notificação recebida."
          items={data.notifications.map((item) => ({
            href: item.notification.link ?? "/dashboard/notificacoes",
            title: item.notification.title,
            meta: `${item.readAt ? "Lida" : "Não lida"} · ${item.notification.createdAt.toLocaleDateString(
              "pt-BR"
            )}`,
            unread: !item.readAt
          }))}
          title="Comunicados recentes"
          visible={permissions.has("notifications:read")}
        />
      </section>
      {shortcuts.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            Atalhos por permissão
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;

              return (
                <Link href={shortcut.href} key={shortcut.href}>
                  <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-4 font-semibold">{shortcut.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shortcut.description}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type RecentListItem = {
  href: string;
  title: string;
  meta: string;
  unread?: boolean;
};

function RecentList({
  title,
  items,
  emptyText,
  visible
}: {
  title: string;
  items: RecentListItem[];
  emptyText: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Badge>{items.length}</Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            className="block rounded-2xl border border-border bg-background px-4 py-3 transition hover:bg-muted"
            href={item.href}
            key={`${item.href}-${item.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.meta}
                </p>
              </div>
              {item.unread ? (
                <span className="mt-1 size-2 rounded-full bg-primary" />
              ) : null}
            </div>
          </Link>
        ))}
        {items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
