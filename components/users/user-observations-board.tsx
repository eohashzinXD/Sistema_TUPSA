"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  createUserObservationAction,
  deleteUserObservationAction,
  updateUserObservationAction
} from "@/actions/user-observations";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type UserObservationItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
};

type UserObservationsBoardProps = {
  canManage: boolean;
  observations: UserObservationItem[];
  userId: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function UserObservationsBoard({
  canManage,
  observations,
  userId
}: UserObservationsBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(observations);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<UserObservationItem | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleting, setDeleting] = useState<UserObservationItem | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string }>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(observations);
  }, [observations]);

  function createObservation() {
    startTransition(async () => {
      const actionResult = await createUserObservationAction({
        userId,
        content
      });

      setResult(actionResult);

      if (actionResult.success) {
        setContent("");
        router.refresh();
      }
    });
  }

  function startEditing(item: UserObservationItem) {
    setEditing(item);
    setEditingContent(item.content);
    setResult({});
  }

  function updateObservation() {
    if (!editing) return;

    const target = editing;
    startTransition(async () => {
      const actionResult = await updateUserObservationAction({
        id: target.id,
        content: editingContent
      });

      setResult(actionResult);

      if (actionResult.success) {
        setItems((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  content: editingContent,
                  updatedAt: new Date().toISOString()
                }
              : item
          )
        );
        setEditing(null);
        setEditingContent("");
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;

    const target = deleting;
    startTransition(async () => {
      const actionResult = await deleteUserObservationAction({ id: target.id });

      setResult(actionResult);

      if (actionResult.success) {
        setItems((current) => current.filter((item) => item.id !== target.id));
        setDeleting(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Card>
        <CardTitle>Observações espirituais</CardTitle>
        <CardDescription>
          Registros internos sobre o acompanhamento do médium.
        </CardDescription>

        {canManage ? (
          <div className="mt-6 space-y-3">
            <textarea
              className="min-h-28 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva uma observação sobre o médium..."
              value={content}
            />
            <div className="flex justify-end">
              <Button
                disabled={isPending || content.trim().length < 2}
                onClick={createObservation}
                type="button"
              >
                {isPending ? "Salvando..." : "Adicionar observação"}
              </Button>
            </div>
          </div>
        ) : null}

        {result.error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.error}
          </p>
        ) : null}
        {result.success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {result.success}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <div
              className="rounded-2xl border border-border bg-background p-4"
              key={item.id}
            >
              {editing?.id === item.id ? (
                <div className="space-y-3">
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
                    onChange={(event) => setEditingContent(event.target.value)}
                    value={editingContent}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      disabled={isPending}
                      onClick={() => setEditing(null)}
                      type="button"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      disabled={isPending || editingContent.trim().length < 2}
                      onClick={updateObservation}
                      type="button"
                    >
                      {isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {item.content}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Registrado por {item.authorName} em{" "}
                      {formatDateTime(item.createdAt)}
                      {item.updatedAt !== item.createdAt
                        ? ` · editado em ${formatDateTime(item.updatedAt)}`
                        : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        onClick={() => startEditing(item)}
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
              )}
            </div>
          ))}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma observação cadastrada.
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <ConfirmDialog
        description="Essa ação remove a observação selecionada. Confirme apenas se deseja excluir esse registro."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        pending={isPending}
        title="Excluir observação?"
      />
    </>
  );
}
