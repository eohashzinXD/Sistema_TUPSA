import Link from "next/link";
import { redirect } from "next/navigation";

import { deactivateUserAction, deleteUserAction } from "@/actions/users";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isSpiritualLeadership } from "@/lib/spiritual-leadership";
import { cn } from "@/lib/utils";

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      rg: true,
      dateOfBirth: true,
      address: true,
      maritalStatus: true,
      hasAllergies: true,
      allergies: true,
      usesContinuousMedication: true,
      continuousMedication: true,
      umbandaStartDate: true,
      active: true,
      headOrixa: true,
      adjuntoOrixa: true,
      frontEntity: true,
      baptismDate: true,
      coronationDate: true,
      deitadaCount: true,
      rightObligations: true,
      leftObligations: true,
      monthlyFeeExempt: true,
      createdAt: true,
      roles: {
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      },
      groups: {
        select: {
          group: {
            select: {
              name: true
            }
          }
        }
      },
      permissions: {
        select: {
          permission: {
            select: {
              key: true
            }
          }
        }
      }
    }
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date);
}

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const [users, canManageObservations] = await Promise.all([
    getUsers(),
    isSpiritualLeadership(session.user.id)
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Administração
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Usuários
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Gerencie acesso, papéis, grupos e permissões individuais.
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          href="/dashboard/usuarios/relatorio"
        >
          Relatorio geral
        </Link>
        <Link
          className={cn(buttonVariants(), "shrink-0")}
          href="/dashboard/usuarios/novo"
        >
          Novo usuario
        </Link>
      </section>
      <div className="grid gap-4">
        {users.map((user) => (
          <Card className="p-5" key={user.id}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {user.name}
                  </h2>
                  <Badge
                    className={
                      user.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                  {user.monthlyFeeExempt ? (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                      Isento da mensalidade
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">
                      Telefone:
                    </span>{" "}
                    {user.phone ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">RG:</span>{" "}
                    {user.rg ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Nascimento:
                    </span>{" "}
                    {user.dateOfBirth
                      ? formatDate(user.dateOfBirth)
                      : "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Endereço:
                    </span>{" "}
                    {user.address ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Estado civil:
                    </span>{" "}
                    {user.maritalStatus ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Início na Umbanda:
                    </span>{" "}
                    {user.umbandaStartDate
                      ? formatDate(user.umbandaStartDate)
                      : "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Alergias:
                    </span>{" "}
                    {user.hasAllergies
                      ? user.allergies ?? "Sim, sem detalhes"
                      : "Não"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Medicação contínua:
                    </span>{" "}
                    {user.usesContinuousMedication
                      ? user.continuousMedication ?? "Sim, sem detalhes"
                      : "Não"}
                  </p>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">
                      Entidade de frente:
                    </span>{" "}
                    {user.frontEntity ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Deitadas do orixá de frente:
                    </span>{" "}
                    {user.deitadaCount}/7
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Batismo:
                    </span>{" "}
                    {user.baptismDate
                      ? formatDate(user.baptismDate)
                      : "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Coroação:
                    </span>{" "}
                    {user.coronationDate
                      ? formatDate(user.coronationDate)
                      : "Não informado"}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <MetaGroup
                    label="Obrigações de direita"
                    values={user.rightObligations}
                  />
                  <MetaGroup
                    label="Obrigações de esquerda"
                    values={user.leftObligations}
                  />
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <MetaGroup
                    label="Papéis"
                    values={user.roles.map((item) => item.role.name)}
                  />
                  <MetaGroup
                    label="Grupos"
                    values={user.groups.map((item) => item.group.name)}
                  />
                  <MetaGroup
                    label="Permissões extras"
                    values={user.permissions.map(
                      (item) => item.permission.key
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href={`/dashboard/usuarios/${user.id}/relatorio`}
                >
                  Relatorio PDF
                </Link>
                {canManageObservations ? (
                  <Link
                    className={cn(buttonVariants({ variant: "outline" }))}
                    href={`/dashboard/usuarios/${user.id}/observacoes`}
                  >
                    Observações
                  </Link>
                ) : null}
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href={`/dashboard/usuarios/${user.id}`}
                >
                  Editar
                </Link>
                {user.active && user.id !== session.user.id ? (
                  <form
                    action={async () => {
                      "use server";
                      await deactivateUserAction({ id: user.id });
                    }}
                  >
                    <Button type="submit" variant="secondary">
                      Desativar
                    </Button>
                  </form>
                ) : null}
                {!user.active && user.id !== session.user.id ? (
                  <form
                    action={async () => {
                      "use server";
                      await deleteUserAction({ id: user.id });
                    }}
                  >
                    <Button type="submit" variant="outline">
                      Excluir
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetaGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">
        {values.length > 0 ? values.join(", ") : "Nenhum"}
      </p>
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
