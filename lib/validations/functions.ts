import { z } from "zod";

export const createFunctionSchema = z
  .object({
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
  })
  .superRefine((value, context) => {
    if (value.endsAt <= value.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "A finalização deve ser depois do início"
      });
    }
  });

export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
