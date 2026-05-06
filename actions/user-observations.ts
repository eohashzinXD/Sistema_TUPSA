"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSpiritualLeadership } from "@/lib/spiritual-leadership";
import {
  createUserObservationSchema,
  deleteUserObservationSchema,
  type CreateUserObservationInput,
  type UpdateUserObservationInput,
  updateUserObservationSchema
} from "@/lib/validations/user-observations";

export type UserObservationActionResult = {
  error?: string;
  success?: string;
};

async function ensureCanManageObservations(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | UserObservationActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const allowed = await isSpiritualLeadership(session.user.id);
  if (!allowed) {
    return {
      error:
        "Somente Pai de Santo, Mãe Pequena ou Pai Pequeno podem alterar observações"
    };
  }

  return {
    allowed: true,
    userId: session.user.id
  };
}

export async function createUserObservationAction(
  input: CreateUserObservationInput
): Promise<UserObservationActionResult> {
  const permission = await ensureCanManageObservations();
  if (!("allowed" in permission)) return permission;

  const parsed = createUserObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true }
  });

  if (!targetUser) {
    return { error: "Usuário não encontrado" };
  }

  await prisma.userObservation.create({
    data: {
      userId: parsed.data.userId,
      authorId: permission.userId,
      content: parsed.data.content
    }
  });

  revalidatePath(`/dashboard/usuarios/${parsed.data.userId}/observacoes`);

  return { success: "Observação cadastrada" };
}

export async function updateUserObservationAction(
  input: UpdateUserObservationInput
): Promise<UserObservationActionResult> {
  const permission = await ensureCanManageObservations();
  if (!("allowed" in permission)) return permission;

  const parsed = updateUserObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const observation = await prisma.userObservation.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true }
  });

  if (!observation) {
    return { error: "Observação não encontrada" };
  }

  await prisma.userObservation.update({
    where: { id: parsed.data.id },
    data: {
      content: parsed.data.content
    }
  });

  revalidatePath(`/dashboard/usuarios/${observation.userId}/observacoes`);

  return { success: "Observação atualizada" };
}

export async function deleteUserObservationAction(input: {
  id: string;
}): Promise<UserObservationActionResult> {
  const permission = await ensureCanManageObservations();
  if (!("allowed" in permission)) return permission;

  const parsed = deleteUserObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const observation = await prisma.userObservation.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true }
  });

  if (!observation) {
    return { error: "Observação não encontrada" };
  }

  await prisma.userObservation.delete({
    where: { id: observation.id }
  });

  revalidatePath(`/dashboard/usuarios/${observation.userId}/observacoes`);

  return { success: "Observação excluída" };
}
