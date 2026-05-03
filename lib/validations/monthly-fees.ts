import { z } from "zod";

export const monthlyPaymentSchema = z.object({
  userId: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  paid: z.coerce.boolean()
});

export type MonthlyPaymentInput = z.infer<typeof monthlyPaymentSchema>;
