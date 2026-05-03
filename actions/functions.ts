"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createFunctionSchema,
  type CreateFunctionInput,
  functionIdSchema,
  updateFunctionSchema,
  type UpdateFunctionInput
} from "@/lib/validations/functions";

export type FunctionActionResult = {
  error?: string;
  success?: string;
};

async function ensurePaiDeSanto(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | FunctionActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const allowed = await hasPermission(session.user.id, "functions:manage");
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

export async function createFunctionAction(
  input: CreateFunctionInput
): Promise<FunctionActionResult> {
  const permission = await ensurePaiDeSanto();
  if (!("allowed" in permission)) return permission;

  const parsed = createFunctionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  await prisma.houseFunction.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      mandatory: true,
      createdById: permission.userId
    }
  });

  revalidatePath("/dashboard/funcoes");
  revalidatePath("/dashboard");

  return { success: "Função criada" };
}

export async function updateFunctionAction(
  input: UpdateFunctionInput
): Promise<FunctionActionResult> {
  const permission = await ensurePaiDeSanto();
  if (!("allowed" in permission)) return permission;

  const parsed = updateFunctionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  await prisma.houseFunction.update({
    where: {
      id: parsed.data.id
    },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      mandatory: true
    }
  });

  revalidatePath("/dashboard/funcoes");
  revalidatePath("/dashboard");

  return { success: "Função atualizada" };
}

export async function deleteFunctionAction(input: {
  id: string;
}): Promise<FunctionActionResult> {
  const permission = await ensurePaiDeSanto();
  if (!("allowed" in permission)) return permission;

  const parsed = functionIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  await prisma.houseFunction.delete({
    where: {
      id: parsed.data.id
    }
  });

  revalidatePath("/dashboard/funcoes");
  revalidatePath("/dashboard");

  return { success: "Função excluída" };
}
