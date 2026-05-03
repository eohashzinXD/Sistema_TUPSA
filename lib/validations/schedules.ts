import { ScheduleType } from "@prisma/client";
import { z } from "zod";

export const scheduleTypes = [
  ScheduleType.FESTAS,
  ScheduleType.AMACIS,
  ScheduleType.GIRAS
] as const;

export const scheduleTypeLabels: Record<ScheduleType, string> = {
  FESTAS: "Festas",
  AMACIS: "Amacis",
  GIRAS: "Giras do mÃªs"
};

export const scheduleMonthSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const upsertScheduleSchema = scheduleMonthSchema.extend({
  type: z.nativeEnum(ScheduleType),
  imageUrl: z.string().min(1, "Envie uma imagem do cronograma")
});

export type ScheduleMonthInput = z.infer<typeof scheduleMonthSchema>;
export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
