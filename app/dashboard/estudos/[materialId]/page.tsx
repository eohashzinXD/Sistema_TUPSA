import { CategoryType, ContentType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { StudyMaterialForm } from "@/components/studies/study-material-form";
import { Card } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type EditStudyMaterialPageProps = {
  params: {
    materialId: string;
  };
};

async function getFormData(materialId: string) {
  const [material, visibilityRows, categories, roles, groups, users] =
    await Promise.all([
      prisma.studyMaterial.findUnique({
        where: { id: materialId },
        select: {
          id: true,
          title: true,
          type: true,
          content: true,
          url: true,
          categoryId: true,
          visibility: true
        }
      }),
      prisma.contentVisibility.findMany({
        where: {
          contentId: materialId,
          contentType: ContentType.STUDY_MATERIAL
        },
        select: {
          targetId: true
        }
      }),
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
    material,
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

export default async function EditStudyMaterialPage({
  params
}: EditStudyMaterialPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canUpdate, visibleContentIds] = await Promise.all([
    hasPermission(session.user.id, "study:read"),
    hasPermission(session.user.id, "study:update"),
    getVisibleContentIdsForUser({
      contentType: ContentType.STUDY_MATERIAL,
      userId: session.user.id
    })
  ]);

  if (!canRead || !canUpdate) {
    return <AccessDenied />;
  }

  const data = await getFormData(params.materialId);
  if (!data.material) notFound();

  const canSeeMaterial =
    data.material.visibility === "ALL" ||
    visibleContentIds.includes(data.material.id);

  if (!canSeeMaterial) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Estudos
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Editar material
        </h1>
      </section>
      <StudyMaterialForm
        categories={data.categories}
        defaultValues={{
          id: data.material.id,
          title: data.material.title,
          type: data.material.type,
          content: data.material.content,
          url: data.material.url,
          categoryId: data.material.categoryId,
          visibility: data.material.visibility,
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
