"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  categoryIdSchema,
  createCategorySchema,
  type CreateCategoryInput,
  updateCategorySchema,
  type UpdateCategoryInput
} from "@/lib/validations/categories";

export type CategoryActionResult = {
  error?: string;
  success?: string;
};

async function ensureCanManageCategories(): Promise<
  | {
      allowed: true;
    }
  | CategoryActionResult
> {
  const session = await auth();
  if (!session) return { error: "Não autenticado" };
  const allowed = await hasPermission(session.user.id, "categories:manage");
  if (!allowed) return { error: "Sem permissão" };

  return { allowed: true };
}

async function validateParent(
  parentId: string | null,
  type: CreateCategoryInput["type"],
  categoryId?: string
): Promise<CategoryActionResult | null> {
  if (!parentId) {
    return null;
  }

  if (parentId === categoryId) {
    return { error: "Não foi possível salvar a categoria" };
  }

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      type: true,
      parentId: true
    }
  });

  if (!parent || parent.type !== type) {
    return { error: "Não foi possível salvar a categoria" };
  }

  if (categoryId && parent.parentId === categoryId) {
    return { error: "Não foi possível salvar a categoria" };
  }

  return null;
}

async function categoryNameExists({
  name,
  type,
  parentId,
  ignoreId
}: {
  name: string;
  type: CreateCategoryInput["type"];
  parentId: string | null;
  ignoreId?: string;
}): Promise<boolean> {
  const existing = await prisma.category.findFirst({
    where: {
      name,
      type,
      parentId,
      ...(ignoreId ? { id: { not: ignoreId } } : {})
    },
    select: { id: true }
  });

  return Boolean(existing);
}

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<CategoryActionResult> {
  const permission = await ensureCanManageCategories();
  if (!("allowed" in permission)) return permission;

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const parentError = await validateParent(
    parsed.data.parentId,
    parsed.data.type
  );
  if (parentError) return parentError;

  const duplicated = await categoryNameExists(parsed.data);
  if (duplicated) {
    return { error: "Não foi possível salvar a categoria" };
  }

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      parentId: parsed.data.parentId
    }
  });

  revalidatePath("/dashboard/categorias");

  return { success: "Categoria criada" };
}

export async function updateCategoryAction(
  input: UpdateCategoryInput
): Promise<CategoryActionResult> {
  const permission = await ensureCanManageCategories();
  if (!("allowed" in permission)) return permission;

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const existing = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { id: true }
  });
  if (!existing) {
    return { error: "Não foi possível salvar a categoria" };
  }

  const parentError = await validateParent(
    parsed.data.parentId,
    parsed.data.type,
    parsed.data.id
  );
  if (parentError) return parentError;

  const duplicated = await categoryNameExists({
    name: parsed.data.name,
    type: parsed.data.type,
    parentId: parsed.data.parentId,
    ignoreId: parsed.data.id
  });
  if (duplicated) {
    return { error: "Não foi possível salvar a categoria" };
  }

  await prisma.category.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      parentId: parsed.data.parentId
    }
  });

  revalidatePath("/dashboard/categorias");
  revalidatePath(`/dashboard/categorias/${parsed.data.id}`);

  return { success: "Categoria atualizada" };
}

export async function deleteCategoryAction(input: {
  id: string;
}): Promise<CategoryActionResult> {
  const permission = await ensureCanManageCategories();
  if (!("allowed" in permission)) return permission;

  const parsed = categoryIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      _count: {
        select: {
          children: true,
          points: true,
          studyMaterials: true
        }
      }
    }
  });

  if (!category) {
    return { error: "Não foi possível remover a categoria" };
  }

  if (
    category._count.children > 0 ||
    category._count.points > 0 ||
    category._count.studyMaterials > 0
  ) {
    return { error: "Não foi possível remover a categoria" };
  }

  await prisma.category.delete({
    where: { id: parsed.data.id }
  });

  revalidatePath("/dashboard/categorias");

  return { success: "Categoria removida" };
}
