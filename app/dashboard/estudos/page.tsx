import {
  ContentTargetType,
  ContentType,
  StudyMaterialType
} from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteStudyMaterialAction } from "@/actions/studies";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const materialTypeLabels: Record<StudyMaterialType, string> = {
  TEXT: "Texto",
  LINK: "Link",
  FILE: "Arquivo"
};

const visibilityLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

async function getVisibleStudyMaterials(userId: string) {
  const visibleContentIds = await getVisibleContentIdsForUser({
    contentType: ContentType.STUDY_MATERIAL,
    userId
  });

  return prisma.studyMaterial.findMany({
    where: {
      OR: [
        { visibility: ContentTargetType.ALL },
        { id: { in: visibleContentIds } }
      ]
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
      visibility: true,
      createdAt: true,
      category: {
        select: {
          name: true,
          parent: {
            select: {
              name: true
            }
          }
        }
      },
      createdBy: {
        select: {
          name: true
        }
      }
    }
  });
}

export default async function StudyMaterialsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canRead = await hasPermission(session.user.id, "study:read");
  if (!canRead) {
    return <AccessDenied />;
  }

  const [materials, canCreate, canUpdate, canDelete] = await Promise.all([
    getVisibleStudyMaterials(session.user.id),
    hasPermission(session.user.id, "study:create"),
    hasPermission(session.user.id, "study:update"),
    hasPermission(session.user.id, "study:delete")
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Conhecimento
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Estudos
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Materiais filtrados conforme papéis, grupos e permissões.
          </p>
        </div>
        {canCreate ? (
          <Link
            className={cn(buttonVariants(), "shrink-0")}
            href="/dashboard/estudos/novo"
          >
            Novo material
          </Link>
        ) : null}
      </section>
      <div className="grid gap-4">
        {materials.map((material) => (
          <Card className="p-5" key={material.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {material.title}
                  </h2>
                  <Badge>{materialTypeLabels[material.type]}</Badge>
                  <Badge className="bg-card">
                    {visibilityLabels[material.visibility]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {material.category.parent
                    ? `${material.category.parent.name} / `
                    : ""}
                  {material.category.name} · criado por {material.createdBy.name}
                </p>
                {material.url ? (
                  <a
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    href={material.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir referência
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    className={cn(buttonVariants({ variant: "outline" }))}
                    href={`/dashboard/estudos/${material.id}`}
                  >
                    Editar
                  </Link>
                ) : null}
                {canDelete ? (
                  <form
                    action={async () => {
                      "use server";
                      await deleteStudyMaterialAction({ id: material.id });
                    }}
                  >
                    <Button type="submit" variant="secondary">
                      Excluir
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
        {materials.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Nenhum material visível</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Não há materiais liberados para o seu acesso no momento.
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
