"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createFunctionSchema,
  type CreateFunctionInput
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

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: session.user.id,
      role: {
        name: "pai-de-santo"
      }
    },
    select: {
      userId: true
    }
  });

  if (!userRole) {
    return { error: "Somente o pai de santo pode criar funções" };
  }

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
