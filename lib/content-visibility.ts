import { ContentTargetType, ContentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type VisibilityInput = {
  targetType: ContentTargetType;
  targetIds: string[];
};

export type UserVisibilityTargets = {
  roleIds: string[];
  groupIds: string[];
  userId: string;
};

export async function getUserVisibilityTargets(
  userId: string
): Promise<UserVisibilityTargets> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      roles: {
        select: {
          roleId: true
        }
      },
      groups: {
        select: {
          groupId: true
        }
      }
    }
  });

  return {
    userId,
    roleIds: user?.roles.map((role) => role.roleId) ?? [],
    groupIds: user?.groups.map((group) => group.groupId) ?? []
  };
}

export async function getVisibleContentIdsForUser({
  contentType,
  userId
}: {
  contentType: ContentType;
  userId: string;
}): Promise<string[]> {
  const targets = await getUserVisibilityTargets(userId);
  const visibilityRows = await prisma.contentVisibility.findMany({
    where: {
      contentType,
      OR: [
        { targetType: ContentTargetType.ALL },
        {
          targetType: ContentTargetType.ROLE,
          targetId: { in: targets.roleIds }
        },
        {
          targetType: ContentTargetType.GROUP,
          targetId: { in: targets.groupIds }
        },
        {
          targetType: ContentTargetType.USER,
          targetId: targets.userId
        }
      ]
    },
    select: {
      contentId: true
    }
  });

  return [...new Set(visibilityRows.map((row) => row.contentId))];
}

export async function replaceContentVisibility({
  contentId,
  contentType,
  targetType,
  targetIds
}: VisibilityInput & {
  contentId: string;
  contentType: ContentType;
}): Promise<void> {
  const normalizedTargetIds = [...new Set(targetIds)];

  await prisma.contentVisibility.deleteMany({
    where: {
      contentId,
      contentType
    }
  });

  await prisma.contentVisibility.createMany({
    data:
      targetType === ContentTargetType.ALL
        ? [
            {
              contentId,
              contentType,
              targetType,
              targetId: null
            }
          ]
        : normalizedTargetIds.map((targetId) => ({
            contentId,
            contentType,
            targetType,
            targetId
          }))
  });
}

export async function resolveRecipientUserIds({
  targetType,
  targetIds
}: VisibilityInput): Promise<string[]> {
  const normalizedTargetIds = [...new Set(targetIds)];

  const users = await prisma.user.findMany({
    where: {
      active: true,
      ...(targetType === ContentTargetType.ALL
        ? {}
        : targetType === ContentTargetType.ROLE
          ? {
              roles: {
                some: {
                  roleId: { in: normalizedTargetIds }
                }
              }
            }
          : targetType === ContentTargetType.GROUP
            ? {
                groups: {
                  some: {
                    groupId: { in: normalizedTargetIds }
                  }
                }
              }
            : {
                id: { in: normalizedTargetIds }
              })
    },
    select: {
      id: true
    }
  });

  return [...new Set(users.map((user) => user.id))];
}
