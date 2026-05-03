import { redirect } from "next/navigation";

import { isPaiDeSanto } from "@/actions/schedules";
import { auth } from "@/auth";
import { ScheduleBoard } from "@/components/schedules/schedule-board";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type SchedulesPageProps = {
  searchParams?: {
    year?: string;
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

  const selectedYear = getSelectedYear(searchParams?.year);
  const schedules = await prisma.schedule.findMany({
    where: {
      year: selectedYear
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
          Festas, amacis e giras do ano
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Filtre por ano e abra o cronograma pelo tipo. Apenas o pai de santo
          pode substituir as imagens publicadas.
        </p>
      </section>

      <ScheduleBoard
        canManage={canManage}
        schedules={scheduleItems}
        year={selectedYear}
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
