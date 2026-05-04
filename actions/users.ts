"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { orixaOptions } from "@/lib/amaci";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  type CreateUserInput,
  updateUserSchema,
  type UpdateUserInput,
  userIdSchema
} from "@/lib/validations/users";

export type UserActionResult = {
  error?: string;
  success?: string;
};

async function ensureCanManageUsers(): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | UserActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };
  const allowed = await hasPermission(session.user.id, "users:manage");
  if (!allowed) return { error: "Sem permissão" };

  return {
    allowed: true,
    userId: session.user.id
  };
}

function normalizeRelationIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function normalizeAmaciOrixas(ids: string[]): string[] {
  return [...new Set(ids)].filter((id) =>
    orixaOptions.includes(id as (typeof orixaOptions)[number])
  );
}

function parseDateInput(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

export async function createUserAction(
  input: CreateUserInput
): Promise<UserActionResult> {
  const permission = await ensureCanManageUsers();
  if (!("allowed" in permission)) return permission;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });

  if (existingUser) {
    return { error: "Não foi possível salvar o usuário" };
  }

  const password = await bcrypt.hash(parsed.data.password, 12);
  const roleIds = normalizeRelationIds(parsed.data.roleIds);
  const groupIds = normalizeRelationIds(parsed.data.groupIds);
  const permissionIds = normalizeRelationIds(parsed.data.permissionIds);
  const amaciOrixas = parsed.data.hasAmaci
    ? normalizeAmaciOrixas(parsed.data.amaciOrixas)
    : [];

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password,
      phone: parsed.data.phone,
      rg: parsed.data.rg,
      dateOfBirth: parseDateInput(parsed.data.dateOfBirth),
      address: parsed.data.address,
      maritalStatus: parsed.data.maritalStatus,
      hasAllergies: parsed.data.hasAllergies,
      allergies: parsed.data.hasAllergies ? parsed.data.allergies : null,
      usesContinuousMedication: parsed.data.usesContinuousMedication,
      continuousMedication: parsed.data.usesContinuousMedication
        ? parsed.data.continuousMedication
        : null,
      umbandaStartDate: parseDateInput(parsed.data.umbandaStartDate),
      active: parsed.data.active,
      headOrixa: parsed.data.headOrixa,
      adjuntoOrixa: parsed.data.adjuntoOrixa,
      frontEntity: parsed.data.frontEntity,
      baptismDate: parseDateInput(parsed.data.baptismDate),
      coronationDate: parseDateInput(parsed.data.coronationDate),
      hasAmaci: parsed.data.hasAmaci,
      deitadaCount: parsed.data.deitadaCount,
      rightObligations: parsed.data.rightObligations,
      leftObligations: parsed.data.leftObligations,
      monthlyFeeExempt: parsed.data.monthlyFeeExempt,
      roles: {
        createMany: {
          data: roleIds.map((roleId) => ({ roleId }))
        }
      },
      groups: {
        createMany: {
          data: groupIds.map((groupId) => ({ groupId }))
        }
      },
      permissions: {
        createMany: {
          data: permissionIds.map((permissionId) => ({ permissionId }))
        }
      },
      amaciBaths: {
        createMany: {
          data: amaciOrixas.map((orixa) => ({
            orixa,
            markedById: permission.userId
          }))
        }
      }
    }
  });

  revalidatePath("/dashboard/usuarios");

  return { success: "Usuário criado" };
}

export async function updateUserAction(
  input: UpdateUserInput
): Promise<UserActionResult> {
  const permission = await ensureCanManageUsers();
  if (!("allowed" in permission)) return permission;

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { id: true }
  });

  if (!existingUser) {
    return { error: "Não foi possível salvar o usuário" };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });

  if (emailOwner && emailOwner.id !== parsed.data.id) {
    return { error: "Não foi possível salvar o usuário" };
  }

  const roleIds = normalizeRelationIds(parsed.data.roleIds);
  const groupIds = normalizeRelationIds(parsed.data.groupIds);
  const permissionIds = normalizeRelationIds(parsed.data.permissionIds);
  const amaciOrixas = parsed.data.hasAmaci
    ? normalizeAmaciOrixas(parsed.data.amaciOrixas)
    : [];
  const password = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 12)
    : undefined;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        rg: parsed.data.rg,
        dateOfBirth: parseDateInput(parsed.data.dateOfBirth),
        address: parsed.data.address,
        maritalStatus: parsed.data.maritalStatus,
        hasAllergies: parsed.data.hasAllergies,
        allergies: parsed.data.hasAllergies ? parsed.data.allergies : null,
        usesContinuousMedication: parsed.data.usesContinuousMedication,
        continuousMedication: parsed.data.usesContinuousMedication
          ? parsed.data.continuousMedication
          : null,
        umbandaStartDate: parseDateInput(parsed.data.umbandaStartDate),
        active: parsed.data.active,
        headOrixa: parsed.data.headOrixa,
        adjuntoOrixa: parsed.data.adjuntoOrixa,
        frontEntity: parsed.data.frontEntity,
        baptismDate: parseDateInput(parsed.data.baptismDate),
        coronationDate: parseDateInput(parsed.data.coronationDate),
        hasAmaci: parsed.data.hasAmaci,
        deitadaCount: parsed.data.deitadaCount,
        rightObligations: parsed.data.rightObligations,
        leftObligations: parsed.data.leftObligations,
        monthlyFeeExempt: parsed.data.monthlyFeeExempt,
        ...(password ? { password } : {})
      }
    }),
    prisma.userRole.deleteMany({
      where: { userId: parsed.data.id }
    }),
    prisma.userGroup.deleteMany({
      where: { userId: parsed.data.id }
    }),
    prisma.userPermission.deleteMany({
      where: { userId: parsed.data.id }
    }),
    prisma.amaciBath.deleteMany({
      where: {
        userId: parsed.data.id,
        orixa: {
          notIn: amaciOrixas
        }
      }
    }),
    prisma.amaciBath.createMany({
      data: amaciOrixas.map((orixa) => ({
        userId: parsed.data.id,
        orixa,
        markedById: permission.userId
      })),
      skipDuplicates: true
    }),
    prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId: parsed.data.id,
        roleId
      }))
    }),
    prisma.userGroup.createMany({
      data: groupIds.map((groupId) => ({
        userId: parsed.data.id,
        groupId
      }))
    }),
    prisma.userPermission.createMany({
      data: permissionIds.map((permissionId) => ({
        userId: parsed.data.id,
        permissionId
      }))
    })
  ]);

  revalidatePath("/dashboard/usuarios");
  revalidatePath(`/dashboard/usuarios/${parsed.data.id}`);

  return { success: "Usuário atualizado" };
}

export async function deactivateUserAction(
  input: { id: string }
): Promise<UserActionResult> {
  const permission = await ensureCanManageUsers();
  if (!("allowed" in permission)) return permission;

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  if (parsed.data.id === permission.userId) {
    return { error: "Não foi possível salvar o usuário" };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { active: false }
  });

  revalidatePath("/dashboard/usuarios");

  return { success: "Usuário desativado" };
}

export async function deleteUserAction(
  input: { id: string }
): Promise<UserActionResult> {
  const permission = await ensureCanManageUsers();
  if (!("allowed" in permission)) return permission;

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  if (parsed.data.id === permission.userId) {
    return { error: "Não foi possível remover o usuário" };
  }

  try {
    await prisma.user.delete({
      where: { id: parsed.data.id }
    });
  } catch {
    return { error: "Não foi possível remover o usuário" };
  }

  revalidatePath("/dashboard/usuarios");

  return { success: "Usuário removido" };
}
