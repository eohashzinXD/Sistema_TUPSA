"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  toggleAmaciBathSchema,
  type ToggleAmaciBathInput,
  updateDeitadaCountSchema,
  type UpdateDeitadaCountInput
} from "@/lib/validations/amaci";

export type AmaciActionResult = {
  error?: string;
  success?: string;
};

async function isPaiDeSanto(userId: string) {
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

export async function toggleAmaciBathAction(
  input: ToggleAmaciBathInput
): Promise<AmaciActionResult> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const parsed = toggleAmaciBathSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "amaci:read"),
    isPaiDeSanto(session.user.id)
  ]);

  if (!canRead) {
    return { error: "Sem permissão" };
  }

  if (!canManage && parsed.data.userId !== session.user.id) {
    return { error: "Você só pode marcar seus próprios banhos" };
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: parsed.data.userId,
      active: true
    },
    select: {
      id: true
    }
  });

  if (!targetUser) {
    return { error: "Usuário não encontrado" };
  }

  if (parsed.data.checked) {
    await prisma.$transaction([
      prisma.amaciBath.upsert({
        where: {
          userId_orixa: {
            userId: parsed.data.userId,
            orixa: parsed.data.orixa
          }
        },
        update: {
          takenAt: new Date(),
          markedById: session.user.id
        },
        create: {
          userId: parsed.data.userId,
          orixa: parsed.data.orixa,
          markedById: session.user.id
        }
      }),
      prisma.user.update({
        where: { id: parsed.data.userId },
        data: { hasAmaci: true }
      })
    ]);
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.amaciBath.deleteMany({
        where: {
          userId: parsed.data.userId,
          orixa: parsed.data.orixa
        }
      });

      const remainingBaths = await tx.amaciBath.count({
        where: { userId: parsed.data.userId }
      });

      if (remainingBaths === 0) {
        await tx.user.update({
          where: { id: parsed.data.userId },
          data: { hasAmaci: false }
        });
      }
    });
  }

  revalidatePath("/dashboard/amaci");

  return {
    success: parsed.data.checked ? "Banho marcado" : "Banho desmarcado"
  };
}

export async function updateDeitadaCountAction(
  input: UpdateDeitadaCountInput
): Promise<AmaciActionResult> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const parsed = updateDeitadaCountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const [canRead, canManage] = await Promise.all([
    hasPermission(session.user.id, "amaci:read"),
    isPaiDeSanto(session.user.id)
  ]);

  if (!canRead) {
    return { error: "Sem permissão" };
  }

  if (!canManage && parsed.data.userId !== session.user.id) {
    return { error: "Você só pode atualizar suas próprias deitadas" };
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: parsed.data.userId,
      active: true
    },
    select: {
      id: true
    }
  });

  if (!targetUser) {
    return { error: "Usuário não encontrado" };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      deitadaCount: parsed.data.deitadaCount
    }
  });

  revalidatePath("/dashboard/amaci");
  revalidatePath(`/dashboard/usuarios/${parsed.data.userId}`);

  return { success: "Deitadas atualizadas" };
}
