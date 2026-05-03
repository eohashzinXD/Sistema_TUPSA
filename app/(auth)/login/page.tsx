import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/(auth)/login/login-form";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Acesso interno
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Entrar no sistema
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use seu e-mail e senha para acessar os materiais, pontos e comunicados
          permitidos para o seu papel na casa.
        </p>
        <LoginForm callbackUrl={searchParams?.callbackUrl} />
      </section>
    </main>
  );
}
