import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FunctionsBoard } from "@/components/functions/functions-board";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function FunctionsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canManage, functions] = await Promise.all([
    hasPermission(session.user.id, "functions:read"),
    hasPermission(session.user.id, "functions:manage"),
    prisma.houseFunction.findMany({
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        mandatory: true,
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  const functionItems = functions.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    mandatory: item.mandatory,
    createdByName: item.createdBy.name
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Agenda
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Funções
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Funções obrigatórias com data e horário de início e finalização.
          </p>
        </div>
        {canManage ? (
          <Link
            className={cn(buttonVariants(), "shrink-0")}
            href="/dashboard/funcoes/nova"
          >
            Nova função
          </Link>
        ) : null}
      </section>

      <FunctionsBoard canManage={canManage} functions={functionItems} />
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
