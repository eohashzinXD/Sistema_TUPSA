import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserForm } from "@/components/users/user-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function getFormOptions() {
  const [roles, groups, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, description: true }
    })
  ]);

  return {
    roles,
    groups,
    permissions: permissions.map((permission) => ({
      id: permission.id,
      name: permission.key,
      description: permission.description
    }))
  };
}

export default async function NewUserPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const options = await getFormOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Usuários
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Novo usuário
        </h1>
      </section>
      <UserForm
        groups={options.groups}
        mode="create"
        permissions={options.permissions}
        roles={options.roles}
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
