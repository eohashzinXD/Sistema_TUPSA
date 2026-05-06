import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const boardRoles = ["pai-de-santo", "pai-pequeno", "mãe-pequena", "tesouraria", "Diretores Gerais", "Secretaria"];

function formatPhone(phone: string | null) {
  return phone ?? "Não informado";
}

function formatRoles(roles: Array<{ role: { name: string } }>) {
  return roles.map((item) => item.role.name).join(", ");
}

export default async function BoardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "board:read");
  if (!allowed) {
    return <AccessDenied />;
  }

  const boardUsers = await prisma.user.findMany({
    where: {
      active: true,
      roles: {
        some: {
          role: {
            name: {
              in: boardRoles
            }
          }
        }
      }
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      roles: {
        where: {
          role: {
            name: {
              in: boardRoles
            }
          }
        },
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Diretoria
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Responsáveis pela condução espiritual e operacional da casa.
        </p>
      </section>

      {boardUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boardUsers.map((user) => (
            <Card className="p-5" key={user.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {user.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Badge className="bg-card">{formatRoles(user.roles)}</Badge>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="font-medium text-foreground">Telefone</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {formatPhone(user.phone)}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold">Nenhum membro encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vincule os papéis de diretoria aos usuários para exibir esta lista.
          </p>
        </Card>
      )}
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
