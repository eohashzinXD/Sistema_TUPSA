import { z } from "zod";

export const createUserObservationSchema = z.object({
  userId: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(2, "Informe a observação")
    .max(4000, "A observação deve ter no máximo 4000 caracteres")
});

export const updateUserObservationSchema = z.object({
  id: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(2, "Informe a observação")
    .max(4000, "A observação deve ter no máximo 4000 caracteres")
});

export const deleteUserObservationSchema = z.object({
  id: z.string().min(1)
});

export type CreateUserObservationInput = z.infer<
  typeof createUserObservationSchema
>;
export type UpdateUserObservationInput = z.infer<
  typeof updateUserObservationSchema
>;
