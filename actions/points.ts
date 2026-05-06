"use server";

import { CategoryType, ContentType, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  replaceContentVisibility,
  resolveRecipientUserIds
} from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUsers } from "@/lib/push-notifications";
import {
  createPointSchema,
  type CreatePointInput,
  pointIdSchema,
  updatePointSchema,
  type UpdatePointInput
} from "@/lib/validations/points";

export type PointActionResult = {
  error?: string;
  success?: string;
};

async function ensurePointPermission(
  permissionKey: string
): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | PointActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };
  const allowed = await hasPermission(session.user.id, permissionKey);
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

async function validatePointCategory(
  categoryId: string
): Promise<PointActionResult | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { type: true }
  });

  if (!category || category.type !== CategoryType.POINT) {
    return { error: "Não foi possível salvar o ponto" };
  }

  return null;
}

async function notifyPointPublished({
  title,
  pointId,
  createdById,
  visibility,
  targetIds
}: {
  title: string;
  pointId: string;
  createdById: string;
  visibility: CreatePointInput["visibility"];
  targetIds: string[];
}): Promise<void> {
  const recipientUserIds = await resolveRecipientUserIds({
    targetType: visibility,
    targetIds
  });

  if (recipientUserIds.length === 0) {
    return;
  }

  await prisma.notification.create({
    data: {
      title: "Novo ponto cantado",
      message: title,
      type: NotificationType.POINT,
      link: `/dashboard/pontos/${pointId}`,
      createdById,
      recipients: {
        createMany: {
          data: recipientUserIds.map((userId) => ({ userId })),
          skipDuplicates: true
        }
      }
    }
  });

  await sendPushNotificationToUsers(recipientUserIds, {
    title: "Novo ponto cantado",
    message: title,
    type: NotificationType.POINT,
    link: `/dashboard/pontos/${pointId}`
  });
}

export async function createPointAction(
  input: CreatePointInput
): Promise<PointActionResult> {
  const permission = await ensurePointPermission("points:create");
  if (!("allowed" in permission)) return permission;

  const parsed = createPointSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const categoryError = await validatePointCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  const point = await prisma.point.create({
    data: {
      title: parsed.data.title,
      lyrics: parsed.data.lyrics,
      entity: parsed.data.entity,
      audioUrl: parsed.data.audioUrl,
      visibility: parsed.data.visibility,
      categoryId: parsed.data.categoryId,
      createdById: permission.userId
    },
    select: { id: true }
  });

  await replaceContentVisibility({
    contentId: point.id,
    contentType: ContentType.POINT,
    targetType: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  await notifyPointPublished({
    title: parsed.data.title,
    pointId: point.id,
    createdById: permission.userId,
    visibility: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  revalidatePath("/dashboard/pontos");
  revalidatePath("/dashboard");

  return { success: "Ponto criado" };
}

export async function updatePointAction(
  input: UpdatePointInput
): Promise<PointActionResult> {
  const permission = await ensurePointPermission("points:update");
  if (!("allowed" in permission)) return permission;

  const parsed = updatePointSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const existing = await prisma.point.findUnique({
    where: { id: parsed.data.id },
    select: { id: true }
  });
  if (!existing) {
    return { error: "Não foi possível salvar o ponto" };
  }

  const categoryError = await validatePointCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  await prisma.point.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      lyrics: parsed.data.lyrics,
      entity: parsed.data.entity,
      audioUrl: parsed.data.audioUrl,
      visibility: parsed.data.visibility,
      categoryId: parsed.data.categoryId
    }
  });

  await replaceContentVisibility({
    contentId: parsed.data.id,
    contentType: ContentType.POINT,
    targetType: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  revalidatePath("/dashboard/pontos");
  revalidatePath(`/dashboard/pontos/${parsed.data.id}`);
  revalidatePath("/dashboard");

  return { success: "Ponto atualizado" };
}

export async function deletePointAction(input: {
  id: string;
}): Promise<PointActionResult> {
  const permission = await ensurePointPermission("points:delete");
  if (!("allowed" in permission)) return permission;

  const parsed = pointIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await prisma.$transaction([
      prisma.contentVisibility.deleteMany({
        where: {
          contentId: parsed.data.id,
          contentType: ContentType.POINT
        }
      }),
      prisma.point.delete({
        where: { id: parsed.data.id }
      })
    ]);
  } catch {
    return { error: "Não foi possível remover o ponto" };
  }

  revalidatePath("/dashboard/pontos");
  revalidatePath("/dashboard");

  return { success: "Ponto removido" };
}
