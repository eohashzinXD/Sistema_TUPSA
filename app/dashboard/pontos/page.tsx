import { ContentTargetType, ContentType } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { deletePointAction } from "@/actions/points";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const visibilityLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

async function getVisiblePoints(userId: string) {
  const visibleContentIds = await getVisibleContentIdsForUser({
    contentType: ContentType.POINT,
    userId
  });

  return prisma.point.findMany({
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
      entity: true,
      audioUrl: true,
      visibility: true,
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

export default async function PointsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canRead = await hasPermission(session.user.id, "points:read");
  if (!canRead) {
    return <AccessDenied />;
  }

  const [points, canCreate, canUpdate, canDelete] = await Promise.all([
    getVisiblePoints(session.user.id),
    hasPermission(session.user.id, "points:create"),
    hasPermission(session.user.id, "points:update"),
    hasPermission(session.user.id, "points:delete")
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Curimba
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Pontos
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pontos cantados filtrados por papéis, grupos e permissões.
          </p>
        </div>
        {canCreate ? (
          <Link
            className={cn(buttonVariants(), "shrink-0")}
            href="/dashboard/pontos/novo"
          >
            Novo ponto
          </Link>
        ) : null}
      </section>
      <div className="grid gap-4">
        {points.map((point) => (
          <Card className="p-5" key={point.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {point.title}
                  </h2>
                  <Badge>{visibilityLabels[point.visibility]}</Badge>
                  {point.entity ? (
                    <Badge className="bg-card">{point.entity}</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {point.category.parent ? `${point.category.parent.name} / ` : ""}
                  {point.category.name} · criado por {point.createdBy.name}
                </p>
                {point.audioUrl ? (
                  <a
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    href={point.audioUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir áudio
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={cn(buttonVariants())}
                  href={`/dashboard/pontos/${point.id}`}
                >
                  Ler letra
                </Link>
                {canUpdate ? (
                  <Link
                    className={cn(buttonVariants({ variant: "outline" }))}
                    href={`/dashboard/pontos/${point.id}/editar`}
                  >
                    Editar
                  </Link>
                ) : null}
                {canDelete ? (
                  <form
                    action={async () => {
                      "use server";
                      await deletePointAction({ id: point.id });
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
        {points.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Nenhum ponto visível</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Não há pontos liberados para o seu acesso no momento.
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
