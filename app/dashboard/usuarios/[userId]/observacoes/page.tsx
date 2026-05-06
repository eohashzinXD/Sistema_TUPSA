import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserObservationsBoard } from "@/components/users/user-observations-board";
import { prisma } from "@/lib/prisma";
import { isSpiritualLeadership } from "@/lib/spiritual-leadership";
import { cn } from "@/lib/utils";

type UserObservationsPageProps = {
  params: {
    userId: string;
  };
};

async function getUserObservationsData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      observations: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

export default async function UserObservationsPage({
  params
}: UserObservationsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const canManageObservations = await isSpiritualLeadership(session.user.id);
  if (!canManageObservations) {
    return <AccessDenied />;
  }

  const user = await getUserObservationsData(params.userId);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Observações
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {user.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          href={`/dashboard/usuarios/${user.id}`}
        >
          Voltar ao cadastro
        </Link>
      </section>
      <UserObservationsBoard
        canManage={canManageObservations}
        observations={user.observations.map((observation) => ({
          id: observation.id,
          content: observation.content,
          createdAt: observation.createdAt.toISOString(),
          updatedAt: observation.updatedAt.toISOString(),
          authorName: observation.author.name
        }))}
        userId={user.id}
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
