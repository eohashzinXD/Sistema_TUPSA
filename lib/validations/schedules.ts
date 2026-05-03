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
  GIRAS: "Giras do ano"
};

export const scheduleYearSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100)
});

export const upsertScheduleSchema = scheduleYearSchema.extend({
  type: z.nativeEnum(ScheduleType),
  imageUrl: z.string().min(1, "Envie uma imagem do cronograma")
});

export type ScheduleYearInput = z.infer<typeof scheduleYearSchema>;
export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
