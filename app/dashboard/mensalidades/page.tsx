import { redirect } from "next/navigation";

import { setMonthlyPaymentAction } from "@/actions/monthly-fees";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez"
];

type MonthlyFeesPageProps = {
  searchParams?: {
    year?: string;
  };
};

function normalizeYear(value?: string) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed >= 2020 && parsed <= 2100) {
    return parsed;
  }

  return new Date().getFullYear();
}

export default async function MonthlyFeesPage({
  searchParams
}: MonthlyFeesPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "monthly-fees:read"),
    hasPermission(session.user.id, "monthly-fees:manage")
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  const year = normalizeYear(searchParams?.year);
  const users = await prisma.user.findMany({
    where: canManage ? { active: true } : { id: session.user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      monthlyFeeExempt: true,
      monthlyPayments: {
        where: { year },
        select: {
          month: true,
          paidAt: true
        }
      }
    }
  });

  const totalPaid = users.reduce((total, user) => {
    if (user.monthlyFeeExempt) return total;
    return total + user.monthlyPayments.length;
  }, 0);
  const totalDue = users.filter((user) => !user.monthlyFeeExempt).length * 12;
  const exemptCount = users.filter((user) => user.monthlyFeeExempt).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Financeiro
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Mensalidades
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Controle anual de mensalidades pagas, pendentes e filhos isentos.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-sm font-medium" htmlFor="year">
            Ano
          </label>
          <input
            className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
            defaultValue={year}
            id="year"
            max={2100}
            min={2020}
            name="year"
            type="number"
          />
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Pagas no ano</p>
          <p className="mt-2 text-2xl font-semibold">
            {totalPaid}/{totalDue}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="mt-2 text-2xl font-semibold">
            {Math.max(totalDue - totalPaid, 0)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Isentos</p>
          <p className="mt-2 text-2xl font-semibold">{exemptCount}</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const paidMonths = new Set(
            user.monthlyPayments.map((payment) => payment.month)
          );

          return (
            <Card className="p-5" key={user.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {user.name}
                    </h2>
                    {user.monthlyFeeExempt ? (
                      <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                        Isento
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Badge className="bg-card">
                  {user.monthlyFeeExempt
                    ? "Sem cobrança"
                    : `${paidMonths.size}/12 pagas`}
                </Badge>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12">
                {monthLabels.map((label, index) => {
                  const month = index + 1;
                  const paid = paidMonths.has(month);

                  return (
                    <form
                      action={async () => {
                        "use server";
                        await setMonthlyPaymentAction({
                          userId: user.id,
                          year,
                          month,
                          paid: !paid
                        });
                      }}
                      key={month}
                    >
                      <Button
                        className="w-full"
                        disabled={!canManage || user.monthlyFeeExempt}
                        size="sm"
                        type="submit"
                        variant={paid ? "default" : "outline"}
                      >
                        {label}
                      </Button>
                    </form>
                  );
                })}
              </div>
            </Card>
          );
        })}
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
