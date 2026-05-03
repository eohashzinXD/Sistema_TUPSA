"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createFunctionAction,
  type FunctionActionResult,
  updateFunctionAction
} from "@/actions/functions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  createFunctionSchema,
  type CreateFunctionInput,
  type UpdateFunctionInput,
  updateFunctionSchema
} from "@/lib/validations/functions";

type FunctionFormValues = CreateFunctionInput | UpdateFunctionInput;

type FunctionFormProps = {
  mode?: "create" | "edit";
  defaultValues?: UpdateFunctionInput;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function FunctionForm({
  mode = "create",
  defaultValues,
  onCancel,
  onSuccess
}: FunctionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FunctionActionResult>({});
  const form = useForm<FunctionFormValues>({
    resolver: zodResolver(
      mode === "create" ? createFunctionSchema : updateFunctionSchema
    ),
    defaultValues:
      mode === "edit" && defaultValues
        ? defaultValues
        : {
            title: "",
            description: "",
            startsAt: undefined,
            endsAt: undefined
          }
  });

  function closeForm() {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push("/dashboard/funcoes");
  }

  function onSubmit(values: FunctionFormValues) {
    startTransition(async () => {
      const actionResult =
        mode === "create"
          ? await createFunctionAction(values as CreateFunctionInput)
          : await updateFunctionAction(values as UpdateFunctionInput);
      setResult(actionResult);

      if (actionResult.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/funcoes");
          router.refresh();
        }
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {"id" in form.getValues() ? (
        <input type="hidden" {...form.register("id")} />
      ) : null}
      <Card>
        <CardTitle>Dados da função</CardTitle>
        <CardDescription>
          Informe o nome e o período da função obrigatória.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Título" error={form.formState.errors.title?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("title")}
            />
          </Field>
          <Field
            label="Início"
            error={form.formState.errors.startsAt?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="datetime-local"
              {...form.register("startsAt")}
            />
          </Field>
          <Field
            label="Finalização"
            error={form.formState.errors.endsAt?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="datetime-local"
              {...form.register("endsAt")}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field
            label="Descrição"
            error={form.formState.errors.description?.message}
          >
            <textarea
              className="min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("description")}
            />
          </Field>
        </div>
      </Card>
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={closeForm}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar função"}
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
