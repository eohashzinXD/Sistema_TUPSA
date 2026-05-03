"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  monthlyPaymentSchema,
  type MonthlyPaymentInput
} from "@/lib/validations/monthly-fees";

export type MonthlyPaymentActionResult = {
  error?: string;
  success?: string;
};

export async function setMonthlyPaymentAction(
  input: MonthlyPaymentInput
): Promise<MonthlyPaymentActionResult> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };

  const allowed = await hasPermission(session.user.id, "monthly-fees:manage");
  if (!allowed) return { error: "Sem permissão" };

  const parsed = monthlyPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos" };

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, monthlyFeeExempt: true }
  });

  if (!user) return { error: "Não foi possível salvar a mensalidade" };
  if (user.monthlyFeeExempt) return { error: "Usuário isento da mensalidade" };

  if (parsed.data.paid) {
    await prisma.monthlyPayment.upsert({
      where: {
        userId_year_month: {
          userId: parsed.data.userId,
          year: parsed.data.year,
          month: parsed.data.month
        }
      },
      update: {
        paidAt: new Date(),
        markedById: session.user.id
      },
      create: {
        userId: parsed.data.userId,
        year: parsed.data.year,
        month: parsed.data.month,
        markedById: session.user.id
      }
    });
  } else {
    await prisma.monthlyPayment.deleteMany({
      where: {
        userId: parsed.data.userId,
        year: parsed.data.year,
        month: parsed.data.month
      }
    });
  }

  revalidatePath("/dashboard/mensalidades");
  revalidatePath("/dashboard/usuarios");
  revalidatePath(`/dashboard/usuarios/${parsed.data.userId}`);

  return { success: "Mensalidade atualizada" };
}
