import { z } from "zod";

import { orixaOptions } from "@/lib/amaci";

export const toggleAmaciBathSchema = z.object({
  userId: z.string().min(1),
  orixa: z.enum(orixaOptions),
  checked: z.boolean()
});

export const updateDeitadaCountSchema = z.object({
  userId: z.string().min(1),
  deitadaCount: z.coerce
    .number()
    .int()
    .min(0, "Informe de 0 a 10 deitadas")
    .max(10, "Informe no máximo 10 deitadas")
});

export type ToggleAmaciBathInput = z.infer<typeof toggleAmaciBathSchema>;
export type UpdateDeitadaCountInput = z.infer<typeof updateDeitadaCountSchema>;
