"use client";

import { ContentTargetType, StudyMaterialType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import posthog from "posthog-js";

import {
  createStudyMaterialAction,
  type StudyMaterialActionResult,
  updateStudyMaterialAction
} from "@/actions/studies";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  createStudyMaterialSchema,
  type CreateStudyMaterialInput,
  type UpdateStudyMaterialInput,
  updateStudyMaterialSchema
} from "@/lib/validations/studies";

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

type StudyMaterialFormValues =
  | CreateStudyMaterialInput
  | UpdateStudyMaterialInput;

type StudyMaterialFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  roles: TargetOption[];
  groups: TargetOption[];
  users: TargetOption[];
  defaultValues?: UpdateStudyMaterialInput;
};

const materialTypeLabels: Record<StudyMaterialType, string> = {
  TEXT: "Texto",
  LINK: "Link",
  FILE: "Arquivo"
};

const visibilityLabels: Record<ContentTargetType, string> = {
  ALL: "Todos",
  ROLE: "Papéis",
  GROUP: "Grupos",
  USER: "Usuários"
};

async function uploadStudyMaterialFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/studies/upload", {
    method: "POST",
    body: formData
  });
  const body = (await response.json()) as StudyMaterialActionResult;

  if (!response.ok || body.error || !body.url) {
    return {
      error: body.error ?? "Não foi possível enviar o arquivo"
    };
  }

  return body;
}

export function StudyMaterialForm({
  mode,
  categories,
  roles,
  groups,
  users,
  defaultValues
}: StudyMaterialFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<StudyMaterialActionResult>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const schema =
    mode === "create" ? createStudyMaterialSchema : updateStudyMaterialSchema;
  const form = useForm<StudyMaterialFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && defaultValues
        ? defaultValues
        : {
            title: "",
            type: StudyMaterialType.TEXT,
            content: "",
            url: "",
            categoryId: "",
            visibility: ContentTargetType.ALL,
            targetIds: []
          }
  });
  const materialType = form.watch("type");
  const visibility = form.watch("visibility");
  const targetOptions =
    visibility === ContentTargetType.ROLE
      ? roles
      : visibility === ContentTargetType.GROUP
        ? groups
        : visibility === ContentTargetType.USER
          ? users
          : [];

  function onSubmit(values: StudyMaterialFormValues) {
    startTransition(async () => {
      let fileUrl = values.url;

      if (values.type === StudyMaterialType.FILE && selectedFile) {
        const uploadResult = await uploadStudyMaterialFile(selectedFile);
        if (uploadResult.error || !uploadResult.url) {
          setResult({
            error: uploadResult.error ?? "Não foi possível enviar o arquivo"
          });
          return;
        }

        fileUrl = uploadResult.url;
      }

      const actionResult =
        mode === "create"
          ? await createStudyMaterialAction({
              ...(values as CreateStudyMaterialInput),
              url: fileUrl
            })
          : await updateStudyMaterialAction({
              ...(values as UpdateStudyMaterialInput),
              url: fileUrl
            });

      setResult(actionResult);

      if (actionResult.success) {
        posthog.capture(mode === "create" ? "study_material_created" : "study_material_updated", {
          material_type: values.type,
          visibility: values.visibility
        });

        if (mode === "create") {
          router.push("/dashboard/estudos");
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
        <CardTitle>Material de estudo</CardTitle>
        <CardDescription>
          Cadastre textos, links ou arquivos e defina quem pode visualizar.
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
          <Field label="Tipo" error={form.formState.errors.type?.message}>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("type", {
                onChange: (event) => {
                  setSelectedFile(null);

                  if (event.target.value === StudyMaterialType.TEXT) {
                    form.setValue("url", "", { shouldDirty: true });
                  }
                }
              })}
            >
              {Object.entries(materialTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
          {materialType === StudyMaterialType.TEXT ? (
            <Field
              label="Conteúdo"
              error={form.formState.errors.content?.message}
            >
              <textarea
                className="min-h-48 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                {...form.register("content")}
              />
            </Field>
          ) : materialType === StudyMaterialType.FILE ? (
            <Field label="Arquivo" error={form.formState.errors.url?.message}>
              <input
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground focus:border-primary"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  form.setValue("url", file ? `upload:${file.name}` : "", {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                type="file"
              />
              {defaultValues?.url ? (
                <a
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                  href={defaultValues.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Arquivo atual
                </a>
              ) : null}
            </Field>
          ) : (
            <Field label="URL" error={form.formState.errors.url?.message}>
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                placeholder="https://..."
                {...form.register("url")}
              />
            </Field>
          )}
        </div>
      </Card>
      {visibility !== ContentTargetType.ALL ? (
        <Card>
          <CardTitle>Alvos de visibilidade</CardTitle>
          <CardDescription>
            O material será visível apenas para os alvos selecionados.
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
          onClick={() => router.push("/dashboard/estudos")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar material"}
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
