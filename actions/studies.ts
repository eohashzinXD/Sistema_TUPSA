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
import {
  createStudyMaterialSchema,
  type CreateStudyMaterialInput,
  studyMaterialIdSchema,
  updateStudyMaterialSchema,
  type UpdateStudyMaterialInput
} from "@/lib/validations/studies";

export type StudyMaterialActionResult = {
  error?: string;
  success?: string;
  url?: string;
};

async function ensureStudyPermission(
  permissionKey: string
): Promise<
  | {
      allowed: true;
      userId: string;
    }
  | StudyMaterialActionResult
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

async function validateStudyCategory(
  categoryId: string
): Promise<StudyMaterialActionResult | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { type: true }
  });

  if (!category || category.type !== CategoryType.STUDY) {
    return { error: "Não foi possível salvar o material" };
  }

  return null;
}

async function notifyStudyPublished({
  title,
  materialId,
  createdById,
  visibility,
  targetIds
}: {
  title: string;
  materialId: string;
  createdById: string;
  visibility: CreateStudyMaterialInput["visibility"];
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
      title: "Novo material de estudo",
      message: title,
      type: NotificationType.STUDY,
      link: `/dashboard/estudos/${materialId}`,
      createdById,
      recipients: {
        createMany: {
          data: recipientUserIds.map((userId) => ({ userId })),
          skipDuplicates: true
        }
      }
    }
  });
}

export async function createStudyMaterialAction(
  input: CreateStudyMaterialInput
): Promise<StudyMaterialActionResult> {
  const permission = await ensureStudyPermission("study:create");
  if (!("allowed" in permission)) return permission;

  const parsed = createStudyMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const categoryError = await validateStudyCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  const material = await prisma.studyMaterial.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content,
      url: parsed.data.url,
      visibility: parsed.data.visibility,
      categoryId: parsed.data.categoryId,
      createdById: permission.userId
    },
    select: { id: true }
  });

  await replaceContentVisibility({
    contentId: material.id,
    contentType: ContentType.STUDY_MATERIAL,
    targetType: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  await notifyStudyPublished({
    title: parsed.data.title,
    materialId: material.id,
    createdById: permission.userId,
    visibility: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  revalidatePath("/dashboard/estudos");
  revalidatePath("/dashboard");

  return { success: "Material criado" };
}

export async function updateStudyMaterialAction(
  input: UpdateStudyMaterialInput
): Promise<StudyMaterialActionResult> {
  const permission = await ensureStudyPermission("study:update");
  if (!("allowed" in permission)) return permission;

  const parsed = updateStudyMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const existing = await prisma.studyMaterial.findUnique({
    where: { id: parsed.data.id },
    select: { id: true }
  });
  if (!existing) {
    return { error: "Não foi possível salvar o material" };
  }

  const categoryError = await validateStudyCategory(parsed.data.categoryId);
  if (categoryError) return categoryError;

  await prisma.studyMaterial.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content,
      url: parsed.data.url,
      visibility: parsed.data.visibility,
      categoryId: parsed.data.categoryId
    }
  });

  await replaceContentVisibility({
    contentId: parsed.data.id,
    contentType: ContentType.STUDY_MATERIAL,
    targetType: parsed.data.visibility,
    targetIds: parsed.data.targetIds
  });

  revalidatePath("/dashboard/estudos");
  revalidatePath(`/dashboard/estudos/${parsed.data.id}`);
  revalidatePath("/dashboard");

  return { success: "Material atualizado" };
}

export async function deleteStudyMaterialAction(input: {
  id: string;
}): Promise<StudyMaterialActionResult> {
  const permission = await ensureStudyPermission("study:delete");
  if (!("allowed" in permission)) return permission;

  const parsed = studyMaterialIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await prisma.$transaction([
      prisma.contentVisibility.deleteMany({
        where: {
          contentId: parsed.data.id,
          contentType: ContentType.STUDY_MATERIAL
        }
      }),
      prisma.studyMaterial.delete({
        where: { id: parsed.data.id }
      })
    ]);
  } catch {
    return { error: "Não foi possível remover o material" };
  }

  revalidatePath("/dashboard/estudos");
  revalidatePath("/dashboard");

  return { success: "Material removido" };
}
