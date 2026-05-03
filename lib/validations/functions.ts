import { z } from "zod";

const functionFields = z.object({
  title: z.string().trim().min(2, "Informe o título").max(160),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  startsAt: z.coerce.date({
    required_error: "Informe a data e hora de início",
    invalid_type_error: "Informe a data e hora de início"
  }),
  endsAt: z.coerce.date({
    required_error: "Informe a data e hora de finalização",
    invalid_type_error: "Informe a data e hora de finalização"
  })
});

function validateFunctionPeriod(
  value: z.infer<typeof functionFields>,
  context: z.RefinementCtx
) {
  if (value.endsAt <= value.startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "A finalização deve ser depois do início"
    });
  }
}

export const createFunctionSchema = functionFields.superRefine(
  validateFunctionPeriod
);

export const updateFunctionSchema = z
  .object({
    id: z.string().cuid()
  })
  .merge(functionFields)
  .superRefine(validateFunctionPeriod);

export const functionIdSchema = z.object({
  id: z.string().cuid()
});

export type CreateFunctionInput = z.input<typeof createFunctionSchema>;
export type UpdateFunctionInput = z.input<typeof updateFunctionSchema>;
