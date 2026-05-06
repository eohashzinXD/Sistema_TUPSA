import type { NotificationType } from "@prisma/client";
import webpush from "web-push";

import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
};

const vapidSubject =
  process.env.WEB_PUSH_VAPID_SUBJECT ?? "mailto:admin@tupsa.local";
const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const vapidPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY;

function isWebPushConfigured(): boolean {
  return Boolean(vapidPublicKey && vapidPrivateKey);
}

function configureWebPush(): boolean {
  if (!isWebPushConfigured()) {
    return false;
  }

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey as string,
    vapidPrivateKey as string
  );

  return true;
}

export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0 || !configureWebPush()) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: {
        in: userIds
      }
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          });
          return;
        }

        console.error("Falha ao enviar Web Push", error);
      }
    })
  );
}
