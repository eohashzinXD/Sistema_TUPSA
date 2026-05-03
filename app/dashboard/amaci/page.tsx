import { Check, Minus } from "lucide-react";
import { redirect } from "next/navigation";

import {
  toggleAmaciBathAction,
  updateDeitadaCountAction
} from "@/actions/amaci";
import { auth } from "@/auth";
import { orixaLabels, orixaOptions, type OrixaCode } from "@/lib/amaci";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AmaciUser = {
  id: string;
  name: string;
  email: string;
  headOrixa: string | null;
  hasAmaci: boolean;
  deitadaCount: number;
  amaciBaths: Array<{
    orixa: string;
    takenAt: Date;
    markedBy: {
      name: string;
    };
  }>;
};

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

async function getAmaciUsers(userId: string, canManage: boolean) {
  return prisma.user.findMany({
    where: canManage ? { active: true } : { id: userId, active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      headOrixa: true,
      hasAmaci: true,
      deitadaCount: true,
      amaciBaths: {
        select: {
          orixa: true,
          takenAt: true,
          markedBy: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
}

export default async function AmaciPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "amaci:read"),
    isPaiDeSanto(session.user.id)
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  const users = await getAmaciUsers(session.user.id, canManage);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Amaci
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Banhos dos orixás
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Marque os banhos tomados para cada orixá. O pai de santo pode atualizar
          todos os filhos; cada filho pode atualizar o próprio controle.
        </p>
      </section>

      <div className="grid gap-4">
        {users.map((user) => (
          <AmaciUserCard
            canManage={canManage}
            currentUserId={session.user.id}
            key={user.id}
            user={user}
          />
        ))}
      </div>
    </div>
  );
}

function AmaciUserCard({
  canManage,
  currentUserId,
  user
}: {
  canManage: boolean;
  currentUserId: string;
  user: AmaciUser;
}) {
  const bathsByOrixa = new Map(
    user.amaciBaths
      .filter((bath): bath is typeof bath & { orixa: OrixaCode } =>
        orixaOptions.includes(bath.orixa as OrixaCode)
      )
      .map((bath) => [bath.orixa, bath])
  );
  const completedCount = bathsByOrixa.size;
  const canToggle = canManage || currentUserId === user.id;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-card">
              Pai de cabeça:{" "}
              {user.headOrixa && user.headOrixa in orixaLabels
                ? orixaLabels[user.headOrixa as OrixaCode]
                : "não informado"}
            </Badge>
            <Badge className={user.hasAmaci ? "" : "bg-card"}>
              {user.hasAmaci ? "Tem amaci" : "Sem amaci"}
            </Badge>
            <Badge className={user.deitadaCount >= 10 ? "" : "bg-card"}>
              {user.deitadaCount}/10 deitadas
            </Badge>
          </div>
        </div>
        <Badge>
          {completedCount}/{orixaOptions.length} banhos
        </Badge>
      </div>

      {canToggle ? (
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Deitadas do pai de cabeça</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Progresso obrigatório: {user.deitadaCount}/10
              </p>
            </div>
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await updateDeitadaCountAction({
                    userId: user.id,
                    deitadaCount: Math.max(0, user.deitadaCount - 1)
                  });
                }}
              >
                <Button
                  disabled={user.deitadaCount <= 0}
                  type="submit"
                  variant="outline"
                >
                  -1
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await updateDeitadaCountAction({
                    userId: user.id,
                    deitadaCount: Math.min(10, user.deitadaCount + 1)
                  });
                }}
              >
                <Button disabled={user.deitadaCount >= 10} type="submit">
                  +1
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {orixaOptions.map((orixa) => {
          const bath = bathsByOrixa.get(orixa);
          const checked = Boolean(bath);

          return (
            <div
              className="rounded-2xl border border-border bg-background p-4"
              key={orixa}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{orixaLabels[orixa]}</p>
                  {bath ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Marcado em {formatDateTime(bath.takenAt)} por{" "}
                      {bath.markedBy.name}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Banho ainda não marcado
                    </p>
                  )}
                </div>
                <span
                  className={
                    checked
                      ? "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
                  }
                >
                  {checked ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Minus className="size-4" aria-hidden="true" />
                  )}
                </span>
              </div>

              {canToggle ? (
                <form
                  action={async () => {
                    "use server";
                    await toggleAmaciBathAction({
                      userId: user.id,
                      orixa,
                      checked: !checked
                    });
                  }}
                  className="mt-4"
                >
                  <Button
                    className="w-full"
                    type="submit"
                    variant={checked ? "outline" : "default"}
                  >
                    {checked ? "Desmarcar banho" : "Marcar banho"}
                  </Button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
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
