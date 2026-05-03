import { z } from "zod";

const logoDataUrlSchema = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: "Use uma imagem JPG, PNG ou WEBP"
  })
  .max(5_600_000, "A logo deve ter no maximo 4 MB")
  .nullable();

export const updateSystemSettingsSchema = z.object({
  templeName: z.string().trim().min(2, "Informe o nome").max(120),
  logoUrl: logoDataUrlSchema
});

export type UpdateSystemSettingsInput = z.infer<
  typeof updateSystemSettingsSchema
>;
