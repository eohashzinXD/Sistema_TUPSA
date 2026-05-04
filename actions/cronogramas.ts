"use server";

import { revalidatePath } from "next/cache";
import { ScheduleType } from "@prisma/client";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  deleteCronogramaSchema,
  upsertCronogramaSchema,
  type UpsertCronogramaInput
} from "@/lib/validations/cronogramas";

export type CronogramaActionResult = {
  error?: string;
  success?: string;
  url?: string;
};

export async function canManageCronogramas(userId: string): Promise<boolean> {
  return hasPermission(userId, "cronogramas:manage");
}

async function ensureCronogramaManager(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | CronogramaActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const allowed = await hasPermission(session.user.id, "cronogramas:manage");
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

export async function upsertCronogramaAction(
  input: UpsertCronogramaInput
): Promise<CronogramaActionResult> {
  const permission = await ensureCronogramaManager();
  if (!("allowed" in permission)) return permission;

  const parsed = upsertCronogramaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const month =
    parsed.data.type === ScheduleType.GIRAS ? parsed.data.month ?? 1 : 1;

  await prisma.schedule.upsert({
    where: {
      type_year_month: {
        type: parsed.data.type,
        year: parsed.data.year,
        month
      }
    },
    update: {
      imageUrl: parsed.data.imageUrl,
      createdById: permission.userId
    },
    create: {
      type: parsed.data.type,
      year: parsed.data.year,
      month,
      imageUrl: parsed.data.imageUrl,
      createdById: permission.userId
    }
  });

  revalidatePath("/dashboard/cronogramas");
  revalidatePath("/dashboard");

  return { success: "Cronograma atualizado" };
}

export async function deleteCronogramaAction(input: {
  id: string;
}): Promise<CronogramaActionResult> {
  const permission = await ensureCronogramaManager();
  if (!("allowed" in permission)) return permission;

  const parsed = deleteCronogramaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  await prisma.schedule.delete({
    where: {
      id: parsed.data.id
    }
  });

  revalidatePath("/dashboard/cronogramas");
  revalidatePath("/dashboard");

  return { success: "Cronograma excluído" };
}
