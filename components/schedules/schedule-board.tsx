"use client";

import { ScheduleType } from "@prisma/client";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  upsertScheduleAction,
  type ScheduleActionResult
} from "@/actions/schedules";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  scheduleTypeLabels,
  scheduleTypes
} from "@/lib/validations/schedules";
import { cn } from "@/lib/utils";

type ScheduleItem = {
  id: string;
  type: ScheduleType;
  imageUrl: string;
  updatedAt: string;
  createdBy: {
    name: string;
  };
};

type ScheduleBoardProps = {
  canManage: boolean;
  monthValue: string;
  schedules: ScheduleItem[];
  year: number;
  month: number;
};

async function uploadScheduleImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/schedules/upload", {
    method: "POST",
    body: formData
  });
  const body = (await response.json()) as ScheduleActionResult;

  if (!response.ok || body.error || !body.url) {
    return {
      error: body.error ?? "NÃ£o foi possÃ­vel enviar a imagem"
    };
  }

  return body;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}

export function ScheduleBoard({
  canManage,
  monthValue,
  schedules,
  year,
  month
}: ScheduleBoardProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ScheduleType>(
    ScheduleType.FESTAS
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScheduleActionResult>({});
  const [isPending, startTransition] = useTransition();
  const schedulesByType = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.type, schedule])),
    [schedules]
  );
  const selectedSchedule = schedulesByType.get(selectedType);

  function onMonthChange(value: string) {
    if (!value) return;

    router.push(`/dashboard/cronogramas?month=${value}`);
  }

  function onSubmit() {
    if (!selectedFile) {
      setResult({ error: "Selecione uma imagem do cronograma" });
      return;
    }

    startTransition(async () => {
      const uploadResult = await uploadScheduleImage(selectedFile);
      if (uploadResult.error || !uploadResult.url) {
        setResult({
          error: uploadResult.error ?? "NÃ£o foi possÃ­vel enviar a imagem"
        });
        return;
      }

      const actionResult = await upsertScheduleAction({
        type: selectedType,
        year,
        month,
        imageUrl: uploadResult.url
      });

      setResult(actionResult);

      if (actionResult.success) {
        setSelectedFile(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-5 p-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium">MÃªs</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
            defaultValue={monthValue}
            max="2100-12"
            min="2020-01"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
          />
        </label>

        <div className="space-y-2">
          {scheduleTypes.map((type) => {
            const active = selectedType === type;
            const hasImage = schedulesByType.has(type);

            return (
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setResult({});
                  setSelectedFile(null);
                }}
                type="button"
              >
                <span className="font-semibold">{scheduleTypeLabels[type]}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : hasImage
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {hasImage ? "Publicado" : "Vazio"}
                </span>
              </button>
            );
          })}
        </div>

        {canManage ? (
          <div className="rounded-2xl border border-border bg-background p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Alterar {scheduleTypeLabels[selectedType]}
              </span>
              <input
                accept=".jpg,.jpeg,.png,.webp"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground focus:border-primary"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setResult({});
                }}
                type="file"
              />
            </label>
            <Button
              className="mt-3 w-full"
              disabled={isPending}
              onClick={onSubmit}
              type="button"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              {isPending ? "Salvando..." : "Salvar imagem"}
            </Button>
          </div>
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
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {scheduleTypeLabels[selectedType]}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {new Intl.DateTimeFormat("pt-BR", {
              month: "long",
              year: "numeric"
            }).format(new Date(year, month - 1, 1))}
          </h2>
          {selectedSchedule ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Atualizado por {selectedSchedule.createdBy.name} em{" "}
              {formatDate(selectedSchedule.updatedAt)}
            </p>
          ) : null}
        </div>

        <div className="bg-background p-4 sm:p-6">
          {selectedSchedule ? (
            <a
              className="block overflow-hidden rounded-2xl border border-border bg-card"
              href={selectedSchedule.imageUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt={`Cronograma de ${scheduleTypeLabels[selectedType]}`}
                className="h-auto w-full object-contain"
                height={1600}
                src={selectedSchedule.imageUrl}
                width={1200}
              />
            </a>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div>
                <ImagePlus
                  className="mx-auto size-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-4 font-semibold">
                  Nenhum cronograma publicado
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Selecione outro mÃªs ou aguarde o pai de santo enviar a imagem.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
