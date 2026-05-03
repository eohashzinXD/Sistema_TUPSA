"use server";

import { revalidatePath } from "next/cache";

import { isPaiDeSanto } from "@/actions/schedules";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SYSTEM_SETTINGS_ID } from "@/lib/settings";
import {
  updateSystemSettingsSchema,
  type UpdateSystemSettingsInput
} from "@/lib/validations/settings";

export type SystemSettingsActionResult = {
  error?: string;
  success?: string;
};

async function ensureCanManageSettings(): Promise<
  | {
      allowed: true;
    }
  | SystemSettingsActionResult
> {
  const session = await auth();
  if (!session) return { error: "Nao autenticado" };

  const canManage = await isPaiDeSanto(session.user.id);
  if (!canManage) return { error: "Sem permissao" };

  return { allowed: true };
}

export async function updateSystemSettingsAction(
  input: UpdateSystemSettingsInput
): Promise<SystemSettingsActionResult> {
  const permission = await ensureCanManageSettings();
  if (!("allowed" in permission)) return permission;

  const parsed = updateSystemSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados invalidos" };
  }

  await prisma.systemSettings.upsert({
    where: {
      id: SYSTEM_SETTINGS_ID
    },
    update: {
      templeName: parsed.data.templeName,
      logoUrl: parsed.data.logoUrl
    },
    create: {
      id: SYSTEM_SETTINGS_ID,
      templeName: parsed.data.templeName,
      logoUrl: parsed.data.logoUrl
    }
  });

  revalidatePath("/dashboard/configuracoes");
  revalidatePath("/dashboard/usuarios/relatorio");
  revalidatePath("/dashboard/usuarios/[userId]/relatorio", "page");

  return { success: "Configuracoes atualizadas" };
}
