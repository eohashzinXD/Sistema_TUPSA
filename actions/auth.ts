"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
};

function sanitizeCallbackUrl(callbackUrl: string | undefined): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
}

function isNextRedirectError(error: unknown): boolean {
  if (!(error instanceof Error) || !("digest" in error)) {
    return false;
  }

  return String(error.digest).startsWith("NEXT_REDIRECT");
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined
  });

  if (!parsed.success) {
    return { error: "E-mail ou senha inválidos" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: sanitizeCallbackUrl(parsed.data.callbackUrl)
    });

    return {};
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos" };
    }

    return { error: "Não foi possível autenticar" };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({
    redirectTo: "/login"
  });
}
