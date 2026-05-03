"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createUserAction,
  updateUserAction,
  type UserActionResult
} from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { orixaLabels, orixaOptions } from "@/lib/amaci";
import {
  createUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  updateUserSchema
} from "@/lib/validations/users";

export type UserFormOption = {
  id: string;
  name: string;
  description?: string | null;
};

type UserFormValues = CreateUserInput | UpdateUserInput;

type UserFormProps = {
  mode: "create" | "edit";
  roles: UserFormOption[];
  groups: UserFormOption[];
  permissions: UserFormOption[];
  defaultValues?: UpdateUserInput;
};

export function UserForm({
  mode,
  roles,
  groups,
  permissions,
  defaultValues
}: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UserActionResult>({});
  const schema = mode === "create" ? createUserSchema : updateUserSchema;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && defaultValues
        ? defaultValues
        : {
            name: "",
            email: "",
            password: "",
            phone: "",
            address: "",
            active: true,
            headOrixa: null,
            hasAmaci: false,
            amaciOrixas: [],
            deitadaCount: 0,
            monthlyFeeExempt: false,
            roleIds: [],
            groupIds: [],
            permissionIds: []
          }
  });
  const hasAmaci = form.watch("hasAmaci");

  function onSubmit(values: UserFormValues) {
    startTransition(async () => {
      const actionResult =
        mode === "create"
          ? await createUserAction(values as CreateUserInput)
          : await updateUserAction(values as UpdateUserInput);

      setResult(actionResult);

      if (actionResult.success) {
        if (mode === "create") {
          router.push("/dashboard/usuarios");
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
        <CardTitle>Cadastro pessoal</CardTitle>
        <CardDescription>
          Dados de identificação e contato do usuário.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nome" error={form.formState.errors.name?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("name")}
            />
          </Field>
          <Field label="E-mail" error={form.formState.errors.email?.message}>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="email"
              {...form.register("email")}
            />
          </Field>
          <Field
            label="Telefone"
            error={form.formState.errors.phone?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              {...form.register("phone")}
            />
          </Field>
          <Field
            label="Endereço"
            error={form.formState.errors.address?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="Rua, número, bairro e cidade"
              {...form.register("address")}
            />
          </Field>
        </div>
      </Card>
      <Card>
        <CardTitle>Acesso ao sistema</CardTitle>
        <CardDescription>
          Defina a senha e se o usuário pode autenticar no sistema.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label={mode === "create" ? "Senha" : "Nova senha"}
            error={form.formState.errors.password?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="password"
              autoComplete="new-password"
              placeholder={
                mode === "edit" ? "Deixe vazio para manter a senha atual" : ""
              }
              {...form.register("password")}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              {...form.register("active")}
            />
            Usuário ativo
          </label>
        </div>
      </Card>
      <Card>
        <CardTitle>Cadastro espiritual</CardTitle>
        <CardDescription>
          Informe o pai de cabeça, se já tem amaci e quantas deitadas já foram
          cumpridas.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Pai de cabeça"
            error={form.formState.errors.headOrixa?.message}
          >
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("headOrixa")}
            >
              <option value="">Não informado</option>
              {orixaOptions.map((orixa) => (
                <option key={orixa} value={orixa}>
                  {orixaLabels[orixa]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Deitadas realizadas"
            error={form.formState.errors.deitadaCount?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              max={10}
              min={0}
              type="number"
              {...form.register("deitadaCount", { valueAsNumber: true })}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              {...form.register("hasAmaci", {
                onChange: (event) => {
                  if (!event.target.checked) {
                    form.setValue("amaciOrixas", [], {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                }
              })}
            />
            Já tem amaci
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              {...form.register("monthlyFeeExempt")}
            />
            Isento da mensalidade
          </label>
        </div>
        {hasAmaci ? (
          <div className="mt-6">
            <p className="text-sm font-medium">Quais amacis já tem?</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {orixaOptions.map((orixa) => (
                <label
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                  key={orixa}
                >
                  <input
                    className="size-4 accent-primary"
                    type="checkbox"
                    value={orixa}
                    {...form.register("amaciOrixas")}
                  />
                  {orixaLabels[orixa]}
                </label>
              ))}
            </div>
            {form.formState.errors.amaciOrixas?.message ? (
              <p className="mt-3 text-xs text-red-700">
                {form.formState.errors.amaciOrixas.message}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>
      <OptionGroup
        description="Um usuário pode ter mais de um papel ao mesmo tempo."
        error={form.formState.errors.roleIds?.message}
        items={roles}
        label="Papéis"
        registerName="roleIds"
        register={form.register}
      />
      <OptionGroup
        description="Grupos são usados para liberar conteúdos e comunicados segmentados."
        error={form.formState.errors.groupIds?.message}
        items={groups}
        label="Grupos"
        registerName="groupIds"
        register={form.register}
      />
      <OptionGroup
        description="Permissões individuais são somadas às permissões dos papéis."
        error={form.formState.errors.permissionIds?.message}
        items={permissions}
        label="Permissões extras"
        registerName="permissionIds"
        register={form.register}
      />
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
          onClick={() => router.push("/dashboard/usuarios")}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar usuário"}
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

type OptionGroupProps = {
  label: string;
  description: string;
  items: UserFormOption[];
  registerName: "roleIds" | "groupIds" | "permissionIds";
  register: ReturnType<typeof useForm<UserFormValues>>["register"];
  error?: string;
};

function OptionGroup({
  label,
  description,
  items,
  registerName,
  register,
  error
}: OptionGroupProps) {
  return (
    <Card>
      <CardTitle>{label}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <label
            className="flex gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
            key={item.id}
          >
            <input
              className="mt-1 size-4 shrink-0 accent-primary"
              type="checkbox"
              value={item.id}
              {...register(registerName)}
            />
            <span>
              <span className="block font-semibold">{item.name}</span>
              {item.description ? (
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
    </Card>
  );
}
