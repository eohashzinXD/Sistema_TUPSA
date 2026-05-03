import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

async function isPaiDeSanto(userId: string) {
  const role = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: "pai-de-santo"
      }
    },
    select: {
      userId: true
    }
  });

  return Boolean(role);
}

export default async function FunctionsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canCreate, functions] = await Promise.all([
    hasPermission(session.user.id, "functions:read"),
    isPaiDeSanto(session.user.id),
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
        {canCreate ? (
          <Link
            className={cn(buttonVariants(), "shrink-0")}
            href="/dashboard/funcoes/nova"
          >
            Nova função
          </Link>
        ) : null}
      </section>

      <div className="grid gap-4">
        {functions.map((item) => (
          <Card className="p-5" key={item.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {item.title}
                  </h2>
                  {item.mandatory ? <Badge>Obrigatória</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDateTime(item.startsAt)} até {formatDateTime(item.endsAt)}
                </p>
                {item.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Criada por {item.createdBy.name}
              </p>
            </div>
          </Card>
        ))}
        {functions.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Nenhuma função cadastrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ainda não há funções obrigatórias registradas.
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
