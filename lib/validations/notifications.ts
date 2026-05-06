import { ContentTargetType, NotificationType } from "@prisma/client";
import { z } from "zod";

const notificationContentSchema = z.object({
  title: z.string().trim().min(2, "Informe o título").max(160),
  message: z.string().trim().min(2, "Informe a mensagem"),
  type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
  link: z
    .string()
    .trim()
    .nullish()
      .transform((value) => (value ? value : null))
});

function validateInternalLink(
  value: { link?: string | null },
  context: z.RefinementCtx
) {
  if (value.link && !value.link.startsWith("/")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["link"],
      message: "Use um link interno iniciado por /"
    });
  }
}

export const notificationContentFormSchema =
  notificationContentSchema.superRefine(validateInternalLink);

export const sendNotificationSchema = z
  .object({
    ...notificationContentSchema.shape,
    targetType: z.nativeEnum(ContentTargetType),
    targetIds: z.array(z.string().min(1)).default([])
  })
  .superRefine((value, context) => {
    if (value.targetType !== ContentTargetType.ALL && value.targetIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetIds"],
        message: "Selecione pelo menos um destinatário"
      });
    }

    validateInternalLink(value, context);
  });

export const notificationRecipientIdSchema = z.object({
  id: z.string().min(1)
});

export const updateNotificationSchema = notificationContentSchema
  .extend({
    id: z.string().min(1)
  })
  .superRefine(validateInternalLink);

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
