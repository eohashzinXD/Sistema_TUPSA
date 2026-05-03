"use client";

import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type AuthActionState } from "@/actions/auth";

type LoginFormProps = {
  callbackUrl?: string;
};

const initialState: AuthActionState = {};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">E-mail</span>
        <input
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Senha</span>
        <input
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}
