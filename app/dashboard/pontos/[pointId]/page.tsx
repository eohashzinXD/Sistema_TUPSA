import { ContentTargetType, ContentType } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVisibleContentIdsForUser } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type PointPageProps = {
  params: {
    pointId: string;
  };
};

const visibilityLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

async function getPoint(pointId: string) {
  return prisma.point.findUnique({
    where: { id: pointId },
    select: {
      id: true,
      title: true,
      lyrics: true,
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

export default async function PointPage({ params }: PointPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canUpdate, visibleContentIds, point] = await Promise.all([
    hasPermission(session.user.id, "points:read"),
    hasPermission(session.user.id, "points:update"),
    getVisibleContentIdsForUser({
      contentType: ContentType.POINT,
      userId: session.user.id
    }),
    getPoint(params.pointId)
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  if (!point) notFound();

  const canSeePoint =
    point.visibility === ContentTargetType.ALL ||
    visibleContentIds.includes(point.id);

  if (!canSeePoint) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Ponto cantado
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {point.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/dashboard/pontos"
            >
              Voltar
            </Link>
            {canUpdate ? (
              <Link
                className={cn(buttonVariants())}
                href={`/dashboard/pontos/${point.id}/editar`}
              >
                Editar
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{visibilityLabels[point.visibility]}</Badge>
          {point.entity ? <Badge className="bg-card">{point.entity}</Badge> : null}
          <Badge className="bg-card">
            {point.category.parent ? `${point.category.parent.name} / ` : ""}
            {point.category.name}
          </Badge>
        </div>
      </section>

      {point.audioUrl ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold">Áudio</h2>
          <a
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            href={point.audioUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir áudio
          </a>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Letra</h2>
        <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-base leading-8 text-foreground">
          {point.lyrics}
        </pre>
        <p className="mt-6 text-sm text-muted-foreground">
          Criado por {point.createdBy.name}
        </p>
      </Card>
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você não tem acesso a este ponto.
      </p>
    </Card>
  );
}
