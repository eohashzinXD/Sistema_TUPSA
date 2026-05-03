import { prisma } from "@/lib/prisma";

export type PermissionCheckResult = {
  allowed: boolean;
  permissions: string[];
};

export async function getUserPermissionKeys(userId: string): Promise<string[]> {
  const user = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: {
      permissions: {
        select: {
          permission: {
            select: {
              key: true
            }
          }
        }
      },
      roles: {
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: {
                    select: {
                      key: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    return [];
  }

  const permissionKeys = new Set<string>();

  for (const userPermission of user.permissions) {
    permissionKeys.add(userPermission.permission.key);
  }

  for (const userRole of user.roles) {
    for (const rolePermission of userRole.role.permissions) {
      permissionKeys.add(rolePermission.permission.key);
    }
  }

  return [...permissionKeys].sort();
}

export async function hasPermission(
  userId: string,
  key: string
): Promise<boolean> {
  const permissions = await getUserPermissionKeys(userId);

  return permissions.includes(key);
}

export async function checkPermission(
  userId: string,
  key: string
): Promise<PermissionCheckResult> {
  const permissions = await getUserPermissionKeys(userId);

  return {
    allowed: permissions.includes(key),
    permissions
  };
}

export async function hasAnyPermission(
  userId: string,
  keys: string[]
): Promise<boolean> {
  const permissions = await getUserPermissionKeys(userId);

  return keys.some((key) => permissions.includes(key));
}

export async function hasAllPermissions(
  userId: string,
  keys: string[]
): Promise<boolean> {
  const permissions = await getUserPermissionKeys(userId);

  return keys.every((key) => permissions.includes(key));
}
