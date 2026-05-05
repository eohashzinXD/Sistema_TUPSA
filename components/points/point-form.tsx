"use client";

import { ContentTargetType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import posthog from "posthog-js";

import {
  createPointAction,
  type PointActionResult,
  updatePointAction
} from "@/actions/points";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  createPointSchema,
  type CreatePointInput,
  type UpdatePointInput,
  updatePointSchema
} from "@/lib/validations/points";

type CategoryOption = {
  id: string;
  name: string;
  parent?: {
    name: string;
  } | null;
};

type TargetOption = {
  id: string;
  name: string;
  description?: string | null;
};

type PointFormValues = CreatePointInput | UpdatePointInput;

type PointFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  roles: TargetOption[];
  groups: TargetOption[];
  users: TargetOption[];
  defaultValues?: UpdatePointInput;
};

const visibilityLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

export function PointForm({
  mode,
  categories,
  roles,
  groups,
  users,
  defaultValues
}: PointFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PointActionResult>({});
  const schema = mode === "create" ? createPointSchema : updatePointSchema;
  const form = useForm<PointFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && defaultValues
        ? defaultValues
        : {
            title: "",
            lyrics: "",
            categoryId: "",
            entity: "",
            audioUrl: "",
            visibility: ContentTargetType.ALL,
            targetIds: []
          }
  });
  const visibility = form.watch("visibility");
  const targetOptions =
    visibility === ContentTargetType.ROLE
      ? roles
      : visibility === ContentTargetType.GROUP
        ? groups
        : visibility === ContentTargetType.USER
          ? users
          : [];

  function onSubmit(values: PointFormValues) {
    startTransition(async () => {
      const actionResult =
        mode === "create"
          ? await createPointAction(values as CreatePointInput)
          : await updatePointAction(values as UpdatePointInput);

      setResult(actionResult);

      if (actionResult.success) {
        posthog.capture(mode === "create" ? "point_created" : "point_updated", {
          visibility: values.visibility,
          has_audio: Boolean((values as CreatePointInput).audioUrl)
        });

        if (mode === "create") {
          router.push("/dashboard/pontos");
        }

        router.refresh();
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {"id" in form.getValues() ? (
        <input type="hidden" {...form.register("id")} />
      ) : null}
      <Card>
        <CardTitle>Ponto cantado</CardTitle>
        <CardDescription>
          Cadastre a letra, linha ou entidade relacionada e controle quem pode
          visualizar.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Título" error={form.formState.errors.title?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("title")}
            />
          </Field>
          <Field label="Categoria" error={form.formState.errors.categoryId?.message}>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("categoryId")}
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parent ? `${category.parent.name} / ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Entidade ou linha" error={form.formState.errors.entity?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="Ex: Caboclos, Pretos Velhos, Ogum"
              {...form.register("entity")}
            />
          </Field>
          <Field label="URL do áudio" error={form.formState.errors.audioUrl?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="https://..."
              {...form.register("audioUrl")}
            />
          </Field>
          <Field
            label="Visibilidade"
            error={form.formState.errors.visibility?.message}
          >
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("visibility", {
                onChange: () => form.setValue("targetIds", [])
              })}
            >
              {Object.entries(visibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Letra" error={form.formState.errors.lyrics?.message}>
            <textarea
              className="min-h-56 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("lyrics")}
            />
          </Field>
        </div>
      </Card>
      {visibility !== ContentTargetType.ALL ? (
        <Card>
          <CardTitle>Alvos de visibilidade</CardTitle>
          <CardDescription>
            O ponto será visível apenas para os alvos selecionados.
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={() => router.push("/dashboard/pontos")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar ponto"}
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
