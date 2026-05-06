import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NotificationForm } from "@/components/notifications/notification-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type EditNotificationPageProps = {
  params: {
    notificationId: string;
  };
};

async function getNotification(notificationId: string) {
  return prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      link: true
    }
  });
}

export default async function EditNotificationPage({
  params
}: EditNotificationPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "notifications:create");
  if (!allowed) {
    return <AccessDenied />;
  }

  const notification = await getNotification(params.notificationId);
  if (!notification) {
    return <NotFound />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Notificações
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Editar comunicado
        </h1>
      </section>
      <NotificationForm
        groups={[]}
        mode="edit"
        roles={[]}
        users={[]}
        defaultValues={{
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link ?? ""
        }}
      />
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

function NotFound() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Comunicado não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Verifique se o comunicado ainda existe.
      </p>
    </Card>
  );
}
