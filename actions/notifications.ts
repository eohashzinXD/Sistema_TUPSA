"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { resolveRecipientUserIds } from "@/lib/content-visibility";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUsers } from "@/lib/push-notifications";
import {
  notificationRecipientIdSchema,
  sendNotificationSchema,
  type SendNotificationInput
} from "@/lib/validations/notifications";

export type NotificationActionResult = {
  error?: string;
  success?: string;
};

async function ensureCanReadNotifications(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | NotificationActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };
  const allowed = await hasPermission(session.user.id, "notifications:read");
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

async function ensureCanCreateNotifications(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | NotificationActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };
  const allowed = await hasPermission(session.user.id, "notifications:create");
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

export async function markNotificationReadAction(input: {
  id: string;
}): Promise<NotificationActionResult> {
  const permission = await ensureCanReadNotifications();
  if (!("allowed" in permission)) return permission;

  const parsed = notificationRecipientIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const recipient = await prisma.notificationRecipient.findFirst({
    where: {
      id: parsed.data.id,
      userId: permission.userId
    },
    select: { id: true }
  });

  if (!recipient) {
    return { error: "Não foi possível atualizar a notificação" };
  }

  await prisma.notificationRecipient.update({
    where: { id: recipient.id },
    data: { readAt: new Date() }
  });

  revalidatePath("/dashboard/notificacoes");
  revalidatePath("/dashboard");

  return { success: "Notificação marcada como lida" };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const permission = await ensureCanReadNotifications();
  if (!("allowed" in permission)) return permission;

  await prisma.notificationRecipient.updateMany({
    where: {
      userId: permission.userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  revalidatePath("/dashboard/notificacoes");
  revalidatePath("/dashboard");

  return { success: "Notificações marcadas como lidas" };
}

export async function sendNotificationAction(
  input: SendNotificationInput
): Promise<NotificationActionResult> {
  const permission = await ensureCanCreateNotifications();
  if (!("allowed" in permission)) return permission;

  const parsed = sendNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const recipientUserIds = await resolveRecipientUserIds({
    targetType: parsed.data.targetType,
    targetIds: parsed.data.targetIds
  });

  if (recipientUserIds.length === 0) {
    return { error: "Nenhum destinatário encontrado" };
  }

  await prisma.notification.create({
    data: {
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      link: parsed.data.link,
      createdById: permission.userId,
      recipients: {
        createMany: {
          data: recipientUserIds.map((userId) => ({ userId })),
          skipDuplicates: true
        }
      }
    }
  });

  await sendPushNotificationToUsers(recipientUserIds, {
    title: parsed.data.title,
    message: parsed.data.message,
    type: parsed.data.type,
    link: parsed.data.link
  });

  revalidatePath("/dashboard/notificacoes");
  revalidatePath("/dashboard");

  return { success: "Notificação enviada" };
}
