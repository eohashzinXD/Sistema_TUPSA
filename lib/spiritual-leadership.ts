import { prisma } from "@/lib/prisma";

const spiritualLeadershipRoles = [
  "pai-de-santo",
  "mãe-pequena",
  "pai-pequeno"
] as const;

export async function isSpiritualLeadership(userId: string): Promise<boolean> {
  const role = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: {
          in: [...spiritualLeadershipRoles]
        }
      }
    },
    select: {
      userId: true
    }
  });

  return Boolean(role);
}
