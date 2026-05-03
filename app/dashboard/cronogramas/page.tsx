import { redirect } from "next/navigation";

import { isPaiDeSanto } from "@/actions/schedules";
import { auth } from "@/auth";
import { ScheduleBoard } from "@/components/schedules/schedule-board";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type SchedulesPageProps = {
  searchParams?: {
    month?: string;
  };
};

function getSelectedMonth(value?: string) {
  const now = new Date();
  const fallback = {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };

  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return fallback;
  }

  const [year, month] = value.split("-").map(Number);

  if (year < 2020 || year > 2100 || month < 1 || month > 12) {
    return fallback;
  }

  return { year, month };
}

function toMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default async function SchedulesPage({
  searchParams
}: SchedulesPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "schedules:read"),
    isPaiDeSanto(session.user.id)
  ]);

  if (!canRead) {
    return <AccessDenied />;
  }

  const selectedMonth = getSelectedMonth(searchParams?.month);
  const schedules = await prisma.schedule.findMany({
    where: {
      year: selectedMonth.year,
      month: selectedMonth.month
    },
    orderBy: {
      type: "asc"
    },
    select: {
      id: true,
      type: true,
      imageUrl: true,
      updatedAt: true,
      createdBy: {
        select: {
          name: true
        }
      }
    }
  });
  const scheduleItems = schedules.map((schedule) => ({
    ...schedule,
    updatedAt: schedule.updatedAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Cronogramas
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Festas, amacis e giras do mês
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Filtre por mês e abra o cronograma pelo tipo. Apenas o pai de santo
          pode substituir as imagens publicadas.
        </p>
      </section>

      <ScheduleBoard
        canManage={canManage}
        month={selectedMonth.month}
        monthValue={toMonthValue(selectedMonth.year, selectedMonth.month)}
        schedules={scheduleItems}
        year={selectedMonth.year}
      />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissÃ£o</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        VocÃª nÃ£o tem acesso a esta Ã¡rea.
      </p>
    </Card>
  );
}
