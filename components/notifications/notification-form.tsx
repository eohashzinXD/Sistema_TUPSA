"use client";

import { ContentTargetType, NotificationType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  sendNotificationAction,
  type NotificationActionResult
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  sendNotificationSchema,
  type SendNotificationInput
} from "@/lib/validations/notifications";

type TargetOption = {
  id: string;
  name: string;
  description?: string | null;
};

type NotificationFormProps = {
  roles: TargetOption[];
  groups: TargetOption[];
  users: TargetOption[];
};

const notificationTypeLabels: Record<NotificationType, string> = {
  INFO: "Informativo",
  STUDY: "Estudo",
  POINT: "Ponto",
  SYSTEM: "Sistema"
};

const targetTypeLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

export function NotificationForm({
  roles,
  groups,
  users
}: NotificationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<NotificationActionResult>({});
  const form = useForm<SendNotificationInput>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      type: NotificationType.INFO,
      link: "",
      targetType: ContentTargetType.ALL,
      targetIds: []
    }
  });
  const targetType = form.watch("targetType");
  const targetOptions =
    targetType === ContentTargetType.ROLE
      ? roles
      : targetType === ContentTargetType.GROUP
        ? groups
        : targetType === ContentTargetType.USER
          ? users
          : [];

  function onSubmit(values: SendNotificationInput) {
    startTransition(async () => {
      const actionResult = await sendNotificationAction(values);
      setResult(actionResult);

      if (actionResult.success) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardTitle>Enviar comunicado</CardTitle>
        <CardDescription>
          Envie uma mensagem manual para todos, papéis, grupos ou usuários
          específicos.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Título" error={form.formState.errors.title?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("title")}
            />
          </Field>
          <Field label="Tipo" error={form.formState.errors.type?.message}>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("type")}
            >
              {Object.entries(notificationTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link interno" error={form.formState.errors.link?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="/dashboard/..."
              {...form.register("link")}
            />
          </Field>
          <Field
            label="Destinatários"
            error={form.formState.errors.targetType?.message}
          >
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("targetType", {
                onChange: () => form.setValue("targetIds", [])
              })}
            >
              {Object.entries(targetTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Mensagem" error={form.formState.errors.message?.message}>
            <textarea
              className="min-h-36 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("message")}
            />
          </Field>
        </div>
      </Card>
      {targetType !== ContentTargetType.ALL ? (
        <Card>
          <CardTitle>Selecionar destinatários</CardTitle>
          <CardDescription>
            A mensagem será enviada apenas para os alvos selecionados.
          </CardDescription>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {targetOptions.map((target) => (
              <label
                className="flex gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                key={target.id}
              >
                <input
                  className="mt-1 size-4 shrink-0 accent-primary"
                  type="checkbox"
                  value={target.id}
                  {...form.register("targetIds")}
                />
                <span>
                  <span className="block font-semibold">{target.name}</span>
                  {target.description ? (
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {target.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          {form.formState.errors.targetIds?.message ? (
            <p className="mt-3 text-xs text-red-700">
              {form.formState.errors.targetIds.message}
            </p>
          ) : null}
        </Card>
      ) : null}
      {result.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </p>
      ) : null}
      {result.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {result.success}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={isPending} type="submit">
          {isPending ? "Enviando..." : "Enviar comunicado"}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}
