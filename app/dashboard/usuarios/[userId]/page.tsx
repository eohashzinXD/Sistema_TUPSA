import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { UserForm } from "@/components/users/user-form";
import { orixaOptions, type OrixaCode } from "@/lib/amaci";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type EditUserPageProps = {
  params: {
    userId: string;
  };
};

async function getFormData(userId: string) {
  const [user, roles, groups, permissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        active: true,
        headOrixa: true,
        hasAmaci: true,
        deitadaCount: true,
        monthlyFeeExempt: true,
        amaciBaths: {
          select: {
            orixa: true
          }
        },
        roles: {
          select: {
            roleId: true
          }
        },
        groups: {
          select: {
            groupId: true
          }
        },
        permissions: {
          select: {
            permissionId: true
          }
        }
      }
    }),
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
    user,
    roles,
    groups,
    permissions: permissions.map((permission) => ({
      id: permission.id,
      name: permission.key,
      description: permission.description
    }))
  };
}

function normalizeHeadOrixa(headOrixa: string | null): OrixaCode | null {
  if (headOrixa && orixaOptions.includes(headOrixa as OrixaCode)) {
    return headOrixa as OrixaCode;
  }

  return null;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const data = await getFormData(params.userId);
  if (!data.user) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Usuários
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Editar usuário
        </h1>
      </section>
      <UserForm
        defaultValues={{
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          password: "",
          phone: data.user.phone,
          address: data.user.address,
          active: data.user.active,
          headOrixa: normalizeHeadOrixa(data.user.headOrixa),
          hasAmaci: data.user.hasAmaci,
          amaciOrixas: data.user.amaciBaths
            .map((item) => normalizeHeadOrixa(item.orixa))
            .filter((orixa): orixa is NonNullable<typeof orixa> =>
              Boolean(orixa)
            ),
          deitadaCount: data.user.deitadaCount,
          monthlyFeeExempt: data.user.monthlyFeeExempt,
          roleIds: data.user.roles.map((item) => item.roleId),
          groupIds: data.user.groups.map((item) => item.groupId),
          permissionIds: data.user.permissions.map((item) => item.permissionId)
        }}
        groups={data.groups}
        mode="edit"
        permissions={data.permissions}
        roles={data.roles}
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
