"use client";

import { CategoryType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionResult
} from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  createCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  updateCategorySchema
} from "@/lib/validations/categories";

type CategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
};

type CategoryFormValues = CreateCategoryInput | UpdateCategoryInput;

type CategoryFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  defaultValues?: UpdateCategoryInput;
};

const categoryTypeLabels: Record<CategoryType, string> = {
  STUDY: "Estudos",
  POINT: "Pontos"
};

export function CategoryForm({
  mode,
  categories,
  defaultValues
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CategoryActionResult>({});
  const schema = mode === "create" ? createCategorySchema : updateCategorySchema;
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && defaultValues
        ? defaultValues
        : {
            name: "",
            type: CategoryType.STUDY,
            parentId: null
          }
  });
  const selectedType = form.watch("type");
  const currentId = mode === "edit" ? defaultValues?.id : undefined;
  const parentOptions = categories.filter(
    (category) => category.type === selectedType && category.id !== currentId
  );

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const actionResult =
        mode === "create"
          ? await createCategoryAction(values as CreateCategoryInput)
          : await updateCategoryAction(values as UpdateCategoryInput);

      setResult(actionResult);

      if (actionResult.success) {
        if (mode === "create") {
          router.push("/dashboard/categorias");
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
        <CardTitle>Dados da categoria</CardTitle>
        <CardDescription>
          Use categorias e subcategorias para organizar materiais de estudo e
          pontos separadamente.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nome" error={form.formState.errors.name?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("name")}
            />
          </Field>
          <Field label="Tipo" error={form.formState.errors.type?.message}>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("type")}
            >
              {Object.entries(categoryTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Categoria superior"
            error={form.formState.errors.parentId?.message}
          >
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("parentId")}
            >
              <option value="">Nenhuma</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parentId ? "Subcategoria: " : ""}
                  {category.name}
                </option>
              ))}
            </select>
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
          onClick={() => router.push("/dashboard/categorias")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar categoria"}
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
