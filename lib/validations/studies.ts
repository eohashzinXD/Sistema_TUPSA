import { ContentTargetType, StudyMaterialType } from "@prisma/client";
import { z } from "zod";

const targetIdsSchema = z.array(z.string().min(1)).default([]);

const studyMaterialFields = z.object({
  title: z.string().trim().min(2, "Informe o título").max(160),
  type: z.nativeEnum(StudyMaterialType),
  content: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  url: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  visibility: z.nativeEnum(ContentTargetType),
  targetIds: targetIdsSchema
});

function validateStudyMaterial(
  value: z.infer<typeof studyMaterialFields>,
  context: z.RefinementCtx
) {
    if (value.type === StudyMaterialType.TEXT && !value.content) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Informe o conteúdo do material"
      });
    }

    if (
      (value.type === StudyMaterialType.LINK ||
        value.type === StudyMaterialType.FILE) &&
      !value.url
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Informe a URL do material"
      });
    }

    if (value.visibility !== ContentTargetType.ALL && value.targetIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetIds"],
        message: "Selecione pelo menos um alvo de visibilidade"
      });
    }
}

export const createStudyMaterialSchema =
  studyMaterialFields.superRefine(validateStudyMaterial);

export const updateStudyMaterialSchema = studyMaterialFields
  .extend({
    id: z.string().min(1)
  })
  .superRefine(validateStudyMaterial);

export const studyMaterialIdSchema = z.object({
  id: z.string().min(1)
});

export type CreateStudyMaterialInput = z.infer<
  typeof createStudyMaterialSchema
>;
export type UpdateStudyMaterialInput = z.infer<
  typeof updateStudyMaterialSchema
>;
