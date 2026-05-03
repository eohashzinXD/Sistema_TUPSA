import { ContentTargetType, NotificationType } from "@prisma/client";
import { z } from "zod";

export const sendNotificationSchema = z
  .object({
    title: z.string().trim().min(2, "Informe o título").max(160),
    message: z.string().trim().min(2, "Informe a mensagem"),
    type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
    link: z
      .string()
      .trim()
      .nullish()
      .transform((value) => (value ? value : null)),
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

    if (value.link && !value.link.startsWith("/")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["link"],
        message: "Use um link interno iniciado por /"
      });
    }
  });

export const notificationRecipientIdSchema = z.object({
  id: z.string().min(1)
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
