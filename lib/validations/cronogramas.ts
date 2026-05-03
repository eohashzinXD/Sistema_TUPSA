import { ScheduleType } from "@prisma/client";
import { z } from "zod";

export const cronogramaTypes = [
  ScheduleType.FESTAS,
  ScheduleType.AMACIS,
  ScheduleType.GIRAS
] as const;

export const cronogramaTypeLabels: Record<ScheduleType, string> = {
  FESTAS: "Festas",
  AMACIS: "Amacis",
  GIRAS: "Giras do ano"
};

export const cronogramaPeriodicityLabels: Record<ScheduleType, string> = {
  FESTAS: "Anual",
  AMACIS: "Anual",
  GIRAS: "Mensal"
};

export const cronogramaYearSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100)
});

export const upsertCronogramaSchema = cronogramaYearSchema.extend({
  type: z.nativeEnum(ScheduleType),
  imageUrl: z.string().min(1, "Envie uma imagem do cronograma")
});

export const deleteCronogramaSchema = z.object({
  id: z.string().cuid()
});

export type CronogramaYearInput = z.infer<typeof cronogramaYearSchema>;
export type UpsertCronogramaInput = z.infer<typeof upsertCronogramaSchema>;
