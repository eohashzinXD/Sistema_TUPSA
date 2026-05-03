import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintReportButton } from "@/components/users/print-report-button";
import { UserReport } from "@/components/users/user-report";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type UserReportPageProps = {
  params: {
    userId: string;
  };
};

async function getUserReportData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
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
      hasAmaci: true,
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
      },
      amaciBaths: {
        orderBy: {
          orixa: "asc"
        },
        select: {
          orixa: true,
          takenAt: true
        }
      }
    }
  });
}

export default async function UserReportPage({ params }: UserReportPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const user = await getUserReportData(params.userId);
  if (!user) notFound();

  return (
    <div className="print-report mx-auto max-w-5xl space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body:has(.print-report) aside,
              body:has(.print-report) header,
              body:has(.print-report) .print-hidden {
                display: none !important;
              }

              body:has(.print-report) main {
                padding: 0 !important;
              }

              body:has(.print-report) .lg\\:pl-80 {
                padding-left: 0 !important;
              }

              body:has(.print-report) {
                background: #ffffff !important;
              }

              .print-report {
                max-width: none !important;
              }
            }
          `
        }}
      />
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between print:border-0 print:p-0 print:shadow-none">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Relatorio
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Cadastro de {user.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Emitido em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short"
            }).format(new Date())}
          </p>
        </div>
        <div className="print-hidden flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/dashboard/usuarios"
          >
            Voltar
          </Link>
          <PrintReportButton />
        </div>
      </section>

      <UserReport users={[user]} />
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
