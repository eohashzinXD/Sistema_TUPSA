import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

async function getAuthorizedUserId(): Promise<string | null> {
  const session = await auth();
  if (!session) return null;

  const allowed = await hasPermission(session.user.id, "notifications:read");
  if (!allowed) return null;

  return session.user.id;
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const parsed = pushSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: {
      endpoint: parsed.data.endpoint
    },
    update: {
      userId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: request.headers.get("user-agent")
    },
    create: {
      userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: request.headers.get("user-agent")
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const parsed = z
    .object({
      endpoint: z.string().url()
    })
    .safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint: parsed.data.endpoint
    }
  });

  return NextResponse.json({ success: true });
}
