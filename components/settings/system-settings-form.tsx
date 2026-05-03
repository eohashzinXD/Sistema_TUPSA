"use client";

import Image from "next/image";
import { useState, useTransition, type FormEvent } from "react";

import {
  updateSystemSettingsAction,
  type SystemSettingsActionResult
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type SystemSettingsFormProps = {
  defaultValues: {
    templeName: string;
    logoUrl: string | null;
  };
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Arquivo invalido"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SystemSettingsForm({
  defaultValues
}: SystemSettingsFormProps) {
  const [templeName, setTempleName] = useState(defaultValues.templeName);
  const [logoUrl, setLogoUrl] = useState<string | null>(defaultValues.logoUrl);
  const [result, setResult] = useState<SystemSettingsActionResult>({});
  const [isPending, startTransition] = useTransition();

  async function onLogoChange(file: File | null) {
    setResult({});

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setResult({ error: "Use uma imagem JPG, PNG ou WEBP" });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setResult({ error: "A logo deve ter no maximo 4 MB" });
      return;
    }

    try {
      setLogoUrl(await readFileAsDataUrl(file));
    } catch {
      setResult({ error: "Nao foi possivel carregar a logo" });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const actionResult = await updateSystemSettingsAction({
        templeName,
        logoUrl
      });

      setResult(actionResult);
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardTitle>Identidade do terreiro</CardTitle>
        <CardDescription>
          Nome e logo usados nos relatorios impressos.
        </CardDescription>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_220px]">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Nome do terreiro</span>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              maxLength={120}
              minLength={2}
              onChange={(event) => {
                setTempleName(event.target.value);
                setResult({});
              }}
              required
              value={templeName}
            />
          </label>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card">
              {logoUrl ? (
                <Image
                  alt="Logo do terreiro"
                  className="h-full w-full object-contain p-3"
                  height={160}
                  src={logoUrl}
                  unoptimized
                  width={220}
                />
              ) : (
                <p className="px-4 text-center text-sm text-muted-foreground">
                  Sem logo
                </p>
              )}
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => setLogoUrl(null)}
              type="button"
              variant="outline"
            >
              Remover logo
            </Button>
          </div>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium">Logo</span>
          <input
            accept=".jpg,.jpeg,.png,.webp"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground focus:border-primary"
            onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
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

      <div className="flex justify-end">
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </div>
    </form>
  );
}
