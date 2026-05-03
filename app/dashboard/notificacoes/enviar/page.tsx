import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NotificationForm } from "@/components/notifications/notification-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function getFormOptions() {
  const [roles, groups, users] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    })
  ]);

  return {
    roles,
    groups,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      description: user.email
    }))
  };
}

export default async function SendNotificationPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "notifications:create");
  if (!allowed) {
    return <AccessDenied />;
  }

  const options = await getFormOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Notificações
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Enviar comunicado
        </h1>
      </section>
      <NotificationForm
        groups={options.groups}
        roles={options.roles}
        users={options.users}
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
