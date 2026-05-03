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
    .min(0, "Informe de 0 a 7 deitadas")
    .max(7, "Informe no máximo 7 deitadas")
});

export type ToggleAmaciBathInput = z.infer<typeof toggleAmaciBathSchema>;
export type UpdateDeitadaCountInput = z.infer<typeof updateDeitadaCountSchema>;
