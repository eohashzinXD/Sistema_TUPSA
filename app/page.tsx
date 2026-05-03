import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-2xl rounded-3xl border border-border bg-card p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Gestão interna
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          TUPSA
        </h1>
        <p className="mt-4 text-muted-foreground">
          Acesse o painel interno para consultar estudos, pontos e comunicados
          autorizados para o seu papel na casa.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className={cn(buttonVariants({ size: "lg" }))} href="/login">
            Entrar no sistema
          </Link>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/dashboard"
          >
            Ir para o painel
          </Link>
        </div>
      </section>
    </main>
  );
}
