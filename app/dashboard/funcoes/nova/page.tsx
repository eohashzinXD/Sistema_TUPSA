import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FunctionForm } from "@/components/functions/function-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

async function isPaiDeSanto(userId: string) {
  const role = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: "pai-de-santo"
      }
    },
    select: {
      userId: true
    }
  });

  return Boolean(role);
}

export default async function NewFunctionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await isPaiDeSanto(session.user.id);
  if (!allowed) {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Funções
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Nova função
        </h1>
      </section>
      <FunctionForm />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Somente o pai de santo pode criar funções.
      </p>
    </Card>
  );
}
