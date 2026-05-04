import { z } from "zod";

import { orixaOptions } from "@/lib/amaci";

const relationIdsSchema = z.array(z.string().min(1)).default([]);
const amaciOrixasSchema = z.array(z.enum(orixaOptions)).default([]);
export const rightObligationOptions = ["Mata", "Cachoeira", "Praia"] as const;
export const leftObligationOptions = [
  "Encruzilhada",
  "Cemitério",
  "Mata",
  "Praia"
] as const;
const rightObligationsSchema = z
  .array(z.enum(rightObligationOptions))
  .default([]);
const leftObligationsSchema = z.array(z.enum(leftObligationOptions)).default([]);
const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();
const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Informe uma data válida")
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();
const headOrixaSchema = z
  .enum(orixaOptions)
  .or(z.literal(""))
  .nullish()
  .transform((value) => (value ? value : null));
const deitadaCountSchema = z.coerce
  .number()
  .int("Informe um número inteiro")
  .min(0, "Informe de 0 a 7 deitadas")
  .max(7, "Informe no máximo 7 deitadas")
  .default(0);

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres");

const optionalPasswordSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length === 0 || value.length >= 8, {
    message: "A senha deve ter pelo menos 8 caracteres"
  })
  .refine((value) => value.length <= 72, {
    message: "A senha deve ter no máximo 72 caracteres"
  })
  .optional();

function validateAmaciSelection(
  value: {
    hasAmaci: boolean;
    amaciOrixas: Array<(typeof orixaOptions)[number]>;
  },
  context: z.RefinementCtx
) {
  if (value.hasAmaci && value.amaciOrixas.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amaciOrixas"],
      message: "Selecione pelo menos um amaci"
    });
  }
}

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome").max(120),
    email: z.string().email("Informe um e-mail válido").trim().toLowerCase(),
    password: passwordSchema,
    phone: optionalTextSchema,
    rg: optionalTextSchema,
    dateOfBirth: optionalDateSchema,
    address: optionalTextSchema,
    maritalStatus: optionalTextSchema,
    hasAllergies: z.boolean().default(false),
    allergies: optionalTextSchema,
    usesContinuousMedication: z.boolean().default(false),
    continuousMedication: optionalTextSchema,
    umbandaStartDate: optionalDateSchema,
    active: z.boolean().default(true),
    headOrixa: headOrixaSchema,
    adjuntoOrixa: headOrixaSchema,
    frontEntity: optionalTextSchema,
    baptismDate: optionalDateSchema,
    coronationDate: optionalDateSchema,
    hasAmaci: z.boolean().default(false),
    amaciOrixas: amaciOrixasSchema,
    deitadaCount: deitadaCountSchema,
    rightObligations: rightObligationsSchema,
    leftObligations: leftObligationsSchema,
    monthlyFeeExempt: z.boolean().default(false),
    roleIds: relationIdsSchema,
    groupIds: relationIdsSchema,
    permissionIds: relationIdsSchema
  })
  .superRefine(validateAmaciSelection);

export const updateUserSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(2, "Informe o nome").max(120),
    email: z.string().email("Informe um e-mail válido").trim().toLowerCase(),
    password: optionalPasswordSchema,
    phone: optionalTextSchema,
    rg: optionalTextSchema,
    dateOfBirth: optionalDateSchema,
    address: optionalTextSchema,
    maritalStatus: optionalTextSchema,
    hasAllergies: z.boolean().default(false),
    allergies: optionalTextSchema,
    usesContinuousMedication: z.boolean().default(false),
    continuousMedication: optionalTextSchema,
    umbandaStartDate: optionalDateSchema,
    active: z.boolean().default(true),
    headOrixa: headOrixaSchema,
    adjuntoOrixa: headOrixaSchema,
    frontEntity: optionalTextSchema,
    baptismDate: optionalDateSchema,
    coronationDate: optionalDateSchema,
    hasAmaci: z.boolean().default(false),
    amaciOrixas: amaciOrixasSchema,
    deitadaCount: deitadaCountSchema,
    rightObligations: rightObligationsSchema,
    leftObligations: leftObligationsSchema,
    monthlyFeeExempt: z.boolean().default(false),
    roleIds: relationIdsSchema,
    groupIds: relationIdsSchema,
    permissionIds: relationIdsSchema
  })
  .superRefine(validateAmaciSelection);

export const userIdSchema = z.object({
  id: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
