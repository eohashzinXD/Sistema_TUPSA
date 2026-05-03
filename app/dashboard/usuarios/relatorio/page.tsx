import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ReportHeader } from "@/components/users/report-header";
import { UserReport } from "@/components/users/user-report";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/settings";

async function getUsersReportData() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
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

export default async function UsersReportPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const [users, settings] = await Promise.all([
    getUsersReportData(),
    getSystemSettings()
  ]);

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
      <ReportHeader
        backHref="/dashboard/usuarios"
        settings={settings}
        title="Cadastro de usuarios"
      />

      <UserReport users={users} />
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
