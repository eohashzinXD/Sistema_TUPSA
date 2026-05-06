import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];

function formatBirthday(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(date);
}

function calculateAge(date: Date, today: Date) {
  let age = today.getFullYear() - date.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (today < birthdayThisYear) {
    age -= 1;
  }

  return age;
}

export default async function BirthdaysPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "birthdays:read");
  if (!allowed) {
    return <AccessDenied />;
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const users = await prisma.user.findMany({
    where: {
      active: true,
      dateOfBirth: {
        not: null
      }
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true
    }
  });
  const birthdayUsers = users
    .flatMap((user) => {
      if (
        user.dateOfBirth === null ||
        user.dateOfBirth.getMonth() !== currentMonth
      ) {
        return [];
      }

      return [{ ...user, dateOfBirth: user.dateOfBirth }];
    })
    .sort((first, second) => {
      const dayDiff =
        first.dateOfBirth.getDate() - second.dateOfBirth.getDate();

      return dayDiff || first.name.localeCompare(second.name, "pt-BR");
    });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Membros
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Aniversariantes do mês
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Aniversários cadastrados para {monthNames[currentMonth]}.
        </p>
      </section>

      {birthdayUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {birthdayUsers.map((user) => (
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
                <Badge className="bg-card">
                  {formatBirthday(user.dateOfBirth)}
                </Badge>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="font-medium text-foreground">Telefone</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {user.phone ?? "Não informado"}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold">
            Nenhum aniversariante neste mês
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre a data de nascimento dos usuários para preencher esta aba.
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
