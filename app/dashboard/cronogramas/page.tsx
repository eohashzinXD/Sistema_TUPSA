import { ScheduleType } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CronogramasBoard } from "@/components/cronogramas/cronogramas-board";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { monthLabels } from "@/lib/validations/cronogramas";

type CronogramasPageProps = {
  searchParams?: {
    type?: string;
    year?: string;
    month?: string;
  };
};

function getSelectedYear(value?: string) {
  const now = new Date();
  const fallback = now.getFullYear();

  if (!value || !/^\d{4}$/.test(value)) {
    return fallback;
  }

  const year = Number(value);

  if (year < 2020 || year > 2100) {
    return fallback;
  }

  return year;
}

function getSelectedMonth(value?: string) {
  const fallback = new Date().getMonth() + 1;

  if (!value || !/^\d{1,2}$/.test(value)) {
    return fallback;
  }

  const month = Number(value);

  if (month < 1 || month > 12) {
    return fallback;
  }

  return month;
}

function getSelectedType(value?: string): ScheduleType {
  if (value && Object.values(ScheduleType).includes(value as ScheduleType)) {
    return value as ScheduleType;
  }

  return ScheduleType.FESTAS;
}

export default async function CronogramasPage({
  searchParams
}: CronogramasPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "cronogramas:read"),
    hasPermission(session.user.id, "cronogramas:manage")
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  const selectedYear = getSelectedYear(searchParams?.year);
  const selectedMonth = getSelectedMonth(searchParams?.month);
  const selectedType = getSelectedType(searchParams?.type);
  const cronogramas = await prisma.schedule.findMany({
    where: {
      year: selectedYear,
      OR: [
        {
          type: ScheduleType.GIRAS,
          month: selectedMonth
        },
        {
          type: {
            in: [ScheduleType.FESTAS, ScheduleType.AMACIS]
          },
          month: 1
        }
      ]
    },
    orderBy: {
      type: "asc"
    },
    select: {
      id: true,
      type: true,
      month: true,
      imageUrl: true,
      updatedAt: true,
      createdBy: {
        select: {
          name: true
        }
      }
    }
  });
  const cronogramaItems = cronogramas.map((cronograma) => ({
    ...cronograma,
    updatedAt: cronograma.updatedAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Cronogramas
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Festas, amacis e giras
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Festas e amacis usam filtro anual. Giras usam filtro mensal; mês
          atual: {monthLabels[selectedMonth - 1]}.
        </p>
      </section>

      <CronogramasBoard
        canManage={canManage}
        cronogramas={cronogramaItems}
        initialType={selectedType}
        month={selectedMonth}
        year={selectedYear}
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
