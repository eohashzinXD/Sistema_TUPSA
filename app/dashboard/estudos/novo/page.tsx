import { CategoryType } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StudyMaterialForm } from "@/components/studies/study-material-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function getFormOptions() {
  const [categories, roles, groups, users] = await Promise.all([
    prisma.category.findMany({
      where: { type: CategoryType.STUDY },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        parent: {
          select: {
            name: true
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
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    })
  ]);

  return {
    categories,
    roles,
    groups,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      description: user.email
    }))
  };
}

export default async function NewStudyMaterialPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "study:create");
  if (!allowed) {
    return <AccessDenied />;
  }

  const options = await getFormOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Estudos
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Novo material
        </h1>
      </section>
      <StudyMaterialForm
        categories={options.categories}
        groups={options.groups}
        mode="create"
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
