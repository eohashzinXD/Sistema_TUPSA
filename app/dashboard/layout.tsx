import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PostHogIdentify } from "@/components/posthog-identify";
import { getNavigationByPermissions } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

type DashboardLayoutProps = {
  children: ReactNode;
};

async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notificationRecipient.count({
    where: {
      userId,
      readAt: null
    }
  });
}

export default async function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const navigationItems = getNavigationByPermissions(
    session.user.permissions
  );
  const unreadNotifications = await getUnreadNotificationCount(session.user.id);

  return (
    <>
      <PostHogIdentify
        userId={session.user.id}
        email={session.user.email}
        name={session.user.name}
      />
      <DashboardShell
        navigationItems={navigationItems}
        pushPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY}
        unreadNotifications={unreadNotifications}
        userName={session.user.name}
      >
        {children}
      </DashboardShell>
    </>
  );
}
