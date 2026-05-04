"use client";

import { ScheduleType } from "@prisma/client";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  deleteCronogramaAction,
  upsertCronogramaAction,
  type CronogramaActionResult
} from "@/actions/cronogramas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  cronogramaPeriodicityLabels,
  cronogramaTypeLabels,
  cronogramaTypes,
  monthLabels
} from "@/lib/validations/cronogramas";
import { cn } from "@/lib/utils";

type CronogramaItem = {
  id: string;
  type: ScheduleType;
  month: number;
  imageUrl: string;
  updatedAt: string;
  createdBy: {
    name: string;
  };
};

type CronogramasBoardProps = {
  canManage: boolean;
  cronogramas: CronogramaItem[];
  initialType: ScheduleType;
  month: number;
  year: number;
};

async function uploadCronogramaImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/cronogramas/upload", {
    method: "POST",
    body: formData
  });
  const body = (await response.json()) as CronogramaActionResult;

  if (!response.ok || body.error || !body.url) {
    return {
      error: body.error ?? "Não foi possível enviar a imagem"
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

export function CronogramasBoard({
  canManage,
  cronogramas,
  initialType,
  month,
  year
}: CronogramasBoardProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ScheduleType>(initialType);
  const [items, setItems] = useState(cronogramas);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [editingType, setEditingType] = useState<ScheduleType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<CronogramaItem | null>(null);
  const [result, setResult] = useState<CronogramaActionResult>({});
  const [isPending, startTransition] = useTransition();
  const cronogramasByType = useMemo(
    () =>
      new Map(items.map((cronograma) => [cronograma.type, cronograma])),
    [items]
  );
  const selectedCronograma = cronogramasByType.get(selectedType);
  const usesMonthlyFilter = selectedType === ScheduleType.GIRAS;
  const showUploadForm =
    canManage && (!selectedCronograma || editingType === selectedType);

  useEffect(() => {
    setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    setItems(cronogramas);
  }, [cronogramas]);

  useEffect(() => {
    setSelectedMonth(month);
  }, [month]);

  function buildCronogramasUrl(next: {
    type?: ScheduleType;
    year?: number;
    month?: number;
  }) {
    const type = next.type ?? selectedType;
    const selectedYear = next.year ?? year;
    const nextMonth = next.month ?? selectedMonth;
    const params = new URLSearchParams({
      type,
      year: String(selectedYear)
    });

    if (type === ScheduleType.GIRAS) {
      params.set("month", String(nextMonth));
    }

    return `/dashboard/cronogramas?${params.toString()}`;
  }

  function onYearChange(value: string) {
    if (!value) return;

    router.push(buildCronogramasUrl({ year: Number(value) }));
  }

  function onMonthChange(value: string) {
    if (!value) return;

    const nextMonth = Number(value);
    setSelectedMonth(nextMonth);
    router.push(
      buildCronogramasUrl({
        type: ScheduleType.GIRAS,
        month: nextMonth
      })
    );
  }

  function onSubmit() {
    if (!selectedFile) {
      setResult({ error: "Selecione uma imagem do cronograma" });
      return;
    }

    startTransition(async () => {
      const uploadResult = await uploadCronogramaImage(selectedFile);
      if (uploadResult.error || !uploadResult.url) {
        setResult({
          error: uploadResult.error ?? "Não foi possível enviar a imagem"
        });
        return;
      }

      const actionResult = await upsertCronogramaAction({
        type: selectedType,
        year,
        month:
          selectedType === ScheduleType.GIRAS ? selectedMonth : undefined,
        imageUrl: uploadResult.url
      });

      setResult(actionResult);

      if (actionResult.success) {
        setSelectedFile(null);
        setEditingType(null);
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;

    const target = deleting;
    startTransition(async () => {
      const actionResult = await deleteCronogramaAction({ id: target.id });

      setResult(actionResult);
      if (actionResult.error) return;

      setDeleting(null);
      setItems((current) => current.filter((item) => item.id !== target.id));
      if (selectedType === target.type) {
        setSelectedFile(null);
        setEditingType(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-5 p-5">
        {usesMonthlyFilter ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Mês</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              onChange={(event) => onMonthChange(event.target.value)}
              value={String(selectedMonth)}
            >
              {monthLabels.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Ano</span>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              defaultValue={String(year)}
              max={2100}
              min={2020}
              onChange={(event) => onYearChange(event.target.value)}
              type="number"
            />
          </label>
        )}

        <div className="space-y-2">
          {cronogramaTypes.map((type) => {
            const active = selectedType === type;
            const hasImage = cronogramasByType.has(type);

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
                  setEditingType(null);
                  setResult({});
                  setSelectedFile(null);
                  router.push(buildCronogramasUrl({ type }));
                }}
                type="button"
              >
                <span className="font-semibold">
                  {cronogramaTypeLabels[type]}
                </span>
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

        {showUploadForm ? (
          <div className="rounded-2xl border border-border bg-background p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">
                {selectedCronograma ? "Editar" : "Publicar"}{" "}
                {cronogramaTypeLabels[selectedType]}
              </span>
              <span className="block text-xs text-muted-foreground">
                Periodicidade: {cronogramaPeriodicityLabels[selectedType]}
                {usesMonthlyFilter
                  ? ` - ${monthLabels[selectedMonth - 1]}`
                  : ""}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {cronogramaTypeLabels[selectedType]}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {usesMonthlyFilter
                  ? `Cronograma de ${monthLabels[selectedMonth - 1]}`
                  : `Cronograma de ${year}`}
              </h2>
              <div className="mt-3">
                <Badge>{cronogramaPeriodicityLabels[selectedType]}</Badge>
              </div>
            </div>
            {canManage && selectedCronograma ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setEditingType(selectedType);
                    setSelectedFile(null);
                    setResult({});
                  }}
                  type="button"
                  variant="outline"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => setDeleting(selectedCronograma)}
                  type="button"
                  variant="outline"
                >
                  Excluir
                </Button>
              </div>
            ) : null}
          </div>
          {selectedCronograma ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Atualizado por {selectedCronograma.createdBy.name} em{" "}
              {formatDate(selectedCronograma.updatedAt)}
            </p>
          ) : null}
        </div>

        <div className="bg-background p-4 sm:p-6">
          {selectedCronograma ? (
            <a
              className="block overflow-hidden rounded-2xl border border-border bg-card"
              href={selectedCronograma.imageUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt={`Cronograma de ${cronogramaTypeLabels[selectedType]}`}
                className="h-auto w-full object-contain"
                height={1600}
                src={selectedCronograma.imageUrl}
                unoptimized
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
                  Selecione outro ano ou aguarde o pai de santo enviar a imagem.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
      <ConfirmDialog
        description="Essa ação remove a imagem publicada para este período. Confirme apenas se deseja excluir o cronograma."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        pending={isPending}
        title="Excluir cronograma?"
      />
    </div>
  );
}
