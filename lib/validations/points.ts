import { ContentTargetType } from "@prisma/client";
import { z } from "zod";

const targetIdsSchema = z.array(z.string().min(1)).default([]);

const pointFields = z.object({
  title: z.string().trim().min(2, "Informe o título").max(160),
  lyrics: z.string().trim().min(2, "Informe a letra"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  entity: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  audioUrl: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  visibility: z.nativeEnum(ContentTargetType),
  targetIds: targetIdsSchema
});

function validatePoint(
  value: z.infer<typeof pointFields>,
  context: z.RefinementCtx
) {
  if (value.visibility !== ContentTargetType.ALL && value.targetIds.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetIds"],
      message: "Selecione pelo menos um alvo de visibilidade"
    });
  }
}

export const createPointSchema = pointFields.superRefine(validatePoint);

export const updatePointSchema = pointFields
  .extend({
    id: z.string().min(1)
  })
  .superRefine(validatePoint);

export const pointIdSchema = z.object({
  id: z.string().min(1)
});

export type CreatePointInput = z.infer<typeof createPointSchema>;
export type UpdatePointInput = z.infer<typeof updatePointSchema>;
