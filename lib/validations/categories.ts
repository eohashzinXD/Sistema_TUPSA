import { CategoryType } from "@prisma/client";
import { z } from "zod";

export const categoryTypeSchema = z.nativeEnum(CategoryType);

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  type: categoryTypeSchema,
  parentId: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null))
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1)
});

export const categoryIdSchema = z.object({
  id: z.string().min(1)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
