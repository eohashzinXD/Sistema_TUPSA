import { NotificationType } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/actions/notifications";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const notificationTypeLabels: Record<NotificationType, string> = {
  INFO: "Informativo",
  STUDY: "Estudo",
  POINT: "Ponto",
  SYSTEM: "Sistema"
};

async function getNotifications(userId: string) {
  return prisma.notificationRecipient.findMany({
    where: { userId },
    orderBy: { notification: { createdAt: "desc" } },
    select: {
      id: true,
      readAt: true,
      notification: {
        select: {
          title: true,
          message: true,
          type: true,
          link: true,
          createdAt: true,
          createdBy: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canRead = await hasPermission(session.user.id, "notifications:read");
  if (!canRead) {
    return <AccessDenied />;
  }

  const [notifications, canCreate] = await Promise.all([
    getNotifications(session.user.id),
    hasPermission(session.user.id, "notifications:create")
  ]);
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Comunicados
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Notificações
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {unreadCount} notificação{unreadCount === 1 ? "" : "es"} não lida
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 ? (
            <form
              action={async () => {
                "use server";
                await markAllNotificationsReadAction();
              }}
            >
              <Button type="submit" variant="outline">
                Marcar todas como lidas
              </Button>
            </form>
          ) : null}
          {canCreate ? (
            <Link
              className={cn(buttonVariants(), "shrink-0")}
              href="/dashboard/notificacoes/enviar"
            >
              Enviar comunicado
            </Link>
          ) : null}
        </div>
      </section>
      <div className="grid gap-4">
        {notifications.map((recipient) => (
          <Card className="p-5" key={recipient.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {recipient.notification.title}
                  </h2>
                  <Badge>{notificationTypeLabels[recipient.notification.type]}</Badge>
                  <Badge
                    className={
                      recipient.readAt
                        ? "bg-card"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }
                  >
                    {recipient.readAt ? "Lida" : "Não lida"}
                  </Badge>
                </div>
                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {recipient.notification.message}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Enviado por {recipient.notification.createdBy.name} em{" "}
                  {recipient.notification.createdAt.toLocaleDateString("pt-BR")}
                </p>
                {recipient.notification.link ? (
                  <Link
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    href={recipient.notification.link}
                  >
                    Abrir link
                  </Link>
                ) : null}
              </div>
              {!recipient.readAt ? (
                <form
                  action={async () => {
                    "use server";
                    await markNotificationReadAction({ id: recipient.id });
                  }}
                >
                  <Button type="submit" variant="secondary">
                    Marcar como lida
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        ))}
        {notifications.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Nenhuma notificação</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não recebeu comunicados.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você não tem acesso a esta área.
      </p>
    </Card>
  );
}
