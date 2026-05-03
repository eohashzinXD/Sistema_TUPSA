"use client";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  pending?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  pending = false,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm">
      <div
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
      >
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={pending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button">
            {pending ? "Excluindo..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
