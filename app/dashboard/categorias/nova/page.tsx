import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CategoryForm } from "@/components/categories/category-form";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function getCategoryOptions() {
  return prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      parentId: true
    }
  });
}

export default async function NewCategoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "categories:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const categories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Categorias
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Nova categoria
        </h1>
      </section>
      <CategoryForm categories={categories} mode="create" />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Sem permissão</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você não tem acesso a esta área.
      </p>
    </Card>
  );
}
