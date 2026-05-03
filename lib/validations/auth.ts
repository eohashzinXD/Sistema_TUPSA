import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido").trim().toLowerCase(),
  password: z.string().min(1, "Informe sua senha"),
  callbackUrl: z.string().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
