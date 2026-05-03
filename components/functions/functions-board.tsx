"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteFunctionAction } from "@/actions/functions";
import { FunctionForm } from "@/components/functions/function-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { UpdateFunctionInput } from "@/lib/validations/functions";

type FunctionBoardItem = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  mandatory: boolean;
  createdByName: string;
};

type FunctionsBoardProps = {
  canManage: boolean;
  functions: FunctionBoardItem[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function toFormValues(item: FunctionBoardItem): UpdateFunctionInput {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    startsAt: item.startsAt.slice(0, 16) as unknown as Date,
    endsAt: item.endsAt.slice(0, 16) as unknown as Date
  };
}

export function FunctionsBoard({ canManage, functions }: FunctionsBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(functions);
  const [editing, setEditing] = useState<FunctionBoardItem | null>(null);
  const [deleting, setDeleting] = useState<FunctionBoardItem | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeEditor() {
    setEditing(null);
    router.refresh();
  }

  function confirmDelete() {
    if (!deleting) return;

    const target = deleting;
    startTransition(async () => {
      const actionResult = await deleteFunctionAction({ id: target.id });

      if (actionResult.error) {
        setResult(actionResult.error);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== target.id));
      setDeleting(null);
      setResult(null);
      router.refresh();
    });
  }

  return (
    <>
      {result ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result}
        </p>
      ) : null}
      <div className="grid gap-4">
        {items.map((item) => (
          <Card className="p-5" key={item.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {item.title}
                  </h2>
                  {item.mandatory ? <Badge>Obrigatória</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDateTime(item.startsAt)} até {formatDateTime(item.endsAt)}
                </p>
                {item.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Criada por {item.createdByName}
                </p>
              </div>
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setEditing(item)}
                    type="button"
                    variant="outline"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDeleting(item)}
                    type="button"
                    variant="outline"
                  >
                    Excluir
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
        {items.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Nenhuma função cadastrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ainda não há funções obrigatórias registradas.
            </p>
          </Card>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-foreground/20 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl">
            <FunctionForm
              defaultValues={toFormValues(editing)}
              mode="edit"
              onCancel={() => setEditing(null)}
              onSuccess={closeEditor}
            />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        description="Essa ação remove a função selecionada. Confirme apenas se deseja excluir esse registro."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        pending={isPending}
        title="Excluir função?"
      />
    </>
  );
}
