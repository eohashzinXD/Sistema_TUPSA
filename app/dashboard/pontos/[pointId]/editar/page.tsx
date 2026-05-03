import { CategoryType, ContentType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PointForm } from "@/components/points/point-form";
import { Card } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type EditPointPageProps = {
  params: {
    pointId: string;
  };
};

async function getFormData(pointId: string) {
  const [point, visibilityRows, categories, roles, groups, users] =
    await Promise.all([
      prisma.point.findUnique({
        where: { id: pointId },
        select: {
          id: true,
          title: true,
          lyrics: true,
          categoryId: true,
          entity: true,
          audioUrl: true,
          visibility: true
        }
      }),
      prisma.contentVisibility.findMany({
        where: {
          contentId: pointId,
          contentType: ContentType.POINT
        },
        select: {
          targetId: true
        }
      }),
      prisma.category.findMany({
        where: { type: CategoryType.POINT },
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
    point,
    targetIds: visibilityRows
      .map((row) => row.targetId)
      .filter((targetId): targetId is string => Boolean(targetId)),
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

export default async function EditPointPage({ params }: EditPointPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canUpdate, visibleContentIds] = await Promise.all([
    hasPermission(session.user.id, "points:read"),
    hasPermission(session.user.id, "points:update"),
    getVisibleContentIdsForUser({
      contentType: ContentType.POINT,
      userId: session.user.id
    })
  ]);

  if (!canRead || !canUpdate) {
    return <AccessDenied />;
  }

  const data = await getFormData(params.pointId);
  if (!data.point) notFound();

  const canSeePoint =
    data.point.visibility === "ALL" || visibleContentIds.includes(data.point.id);

  if (!canSeePoint) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Pontos
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Editar ponto
        </h1>
      </section>
      <PointForm
        categories={data.categories}
        defaultValues={{
          id: data.point.id,
          title: data.point.title,
          lyrics: data.point.lyrics,
          categoryId: data.point.categoryId,
          entity: data.point.entity,
          audioUrl: data.point.audioUrl,
          visibility: data.point.visibility,
          targetIds: data.targetIds
        }}
        groups={data.groups}
        mode="edit"
        roles={data.roles}
        users={data.users}
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
