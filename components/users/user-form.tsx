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
  leftObligationOptions,
  type CreateUserInput,
  rightObligationOptions,
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
            maritalStatus: "",
            hasAllergies: false,
            allergies: "",
            usesContinuousMedication: false,
            continuousMedication: "",
            umbandaStartDate: "",
            active: true,
            headOrixa: null,
            adjuntoOrixa: null,
            frontEntity: "",
            baptismDate: "",
            coronationDate: "",
            hasAmaci: false,
            amaciOrixas: [],
            deitadaCount: 0,
            rightObligations: [],
            leftObligations: [],
            monthlyFeeExempt: false,
            roleIds: [],
            groupIds: [],
            permissionIds: []
          }
  });
  const hasAmaci = form.watch("hasAmaci");
  const hasAllergies = form.watch("hasAllergies");
  const usesContinuousMedication = form.watch("usesContinuousMedication");

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
          <Field
            label="Estado civil"
            error={form.formState.errors.maritalStatus?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="Solteiro(a), casado(a), união estável..."
              {...form.register("maritalStatus")}
            />
          </Field>
          <Field
            label="Data de início na Umbanda"
            error={form.formState.errors.umbandaStartDate?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="date"
              {...form.register("umbandaStartDate")}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              {...form.register("hasAllergies", {
                onChange: (event) => {
                  if (!event.target.checked) {
                    form.setValue("allergies", "", {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                }
              })}
            />
            Tem alergias
          </label>
          {hasAllergies ? (
            <Field
              label="Quais alergias?"
              error={form.formState.errors.allergies?.message}
            >
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                {...form.register("allergies")}
              />
            </Field>
          ) : null}
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              {...form.register("usesContinuousMedication", {
                onChange: (event) => {
                  if (!event.target.checked) {
                    form.setValue("continuousMedication", "", {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }
                }
              })}
            />
            Uso de medicação contínua
          </label>
          {usesContinuousMedication ? (
            <Field
              label="Quais medicações?"
              error={form.formState.errors.continuousMedication?.message}
            >
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                {...form.register("continuousMedication")}
              />
            </Field>
          ) : null}
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
          Informe orixás, entidade de frente, datas religiosas, amaci e
          obrigações.
        </CardDescription>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Orixá de cabeça"
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
            label="Orixá adjunto"
            error={form.formState.errors.adjuntoOrixa?.message}
          >
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("adjuntoOrixa")}
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
            label="Entidade de frente"
            error={form.formState.errors.frontEntity?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              {...form.register("frontEntity")}
            />
          </Field>
          <Field
            label="Batismo em"
            error={form.formState.errors.baptismDate?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="date"
              {...form.register("baptismDate")}
            />
          </Field>
          <Field
            label="Coroação"
            error={form.formState.errors.coronationDate?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              type="date"
              {...form.register("coronationDate")}
            />
          </Field>
          <Field
            label="Deitadas do orixá de frente"
            error={form.formState.errors.deitadaCount?.message}
          >
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              max={7}
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
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <CheckboxGroup
            error={form.formState.errors.rightObligations?.message}
            label="Obrigações de direita"
            options={rightObligationOptions}
            register={form.register}
            registerName="rightObligations"
          />
          <CheckboxGroup
            error={form.formState.errors.leftObligations?.message}
            label="Obrigações de esquerda"
            options={leftObligationOptions}
            register={form.register}
            registerName="leftObligations"
          />
        </div>
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

type CheckboxGroupProps = {
  label: string;
  options: readonly string[];
  registerName: "rightObligations" | "leftObligations";
  register: ReturnType<typeof useForm<UserFormValues>>["register"];
  error?: string;
};

function CheckboxGroup({
  label,
  options,
  registerName,
  register,
  error
}: CheckboxGroupProps) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 grid gap-3">
        {options.map((option) => (
          <label
            className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
            key={option}
          >
            <input
              className="size-4 accent-primary"
              type="checkbox"
              value={option}
              {...register(registerName)}
            />
            {option}
          </label>
        ))}
      </div>
      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
    </div>
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
