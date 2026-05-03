"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertScheduleSchema,
  type UpsertScheduleInput
} from "@/lib/validations/schedules";

export type ScheduleActionResult = {
  error?: string;
  success?: string;
  url?: string;
};

export async function isPaiDeSanto(userId: string): Promise<boolean> {
  const role = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: "pai-de-santo"
      }
    },
    select: {
      userId: true
    }
  });

  return Boolean(role);
}

async function ensureScheduleManager(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | ScheduleActionResult
> {
  const session = await auth();
  if (!session) return { error: "NÃ£o autenticado" };

  const canManage = await isPaiDeSanto(session.user.id);
  if (!canManage) return { error: "Sem permissÃ£o" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

export async function upsertScheduleAction(
  input: UpsertScheduleInput
): Promise<ScheduleActionResult> {
  const permission = await ensureScheduleManager();
  if (!("allowed" in permission)) return permission;

  const parsed = upsertScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados invÃ¡lidos" };
  }

  await prisma.schedule.upsert({
    where: {
      type_year_month: {
        type: parsed.data.type,
        year: parsed.data.year,
        month: parsed.data.month
      }
    },
    update: {
      imageUrl: parsed.data.imageUrl,
      createdById: permission.userId
    },
    create: {
      type: parsed.data.type,
      year: parsed.data.year,
      month: parsed.data.month,
      imageUrl: parsed.data.imageUrl,
      createdById: permission.userId
    }
  });

  revalidatePath("/dashboard/cronogramas");
  revalidatePath("/dashboard");

  return { success: "Cronograma atualizado" };
}
