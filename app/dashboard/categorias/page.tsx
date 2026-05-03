import { CategoryType } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteCategoryAction } from "@/actions/categories";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const categoryTypeLabels: Record<CategoryType, string> = {
  STUDY: "Estudos",
  POINT: "Pontos"
};

async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      parentId: true,
      parent: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          children: true,
          points: true,
          studyMaterials: true
        }
      }
    }
  });
}

export default async function CategoriesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = await hasPermission(session.user.id, "categories:manage");
  if (!allowed) {
    return <AccessDenied />;
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Organização
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Categorias
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estruture estudos e pontos com categorias e subcategorias.
          </p>
        </div>
        <Link
          className={cn(buttonVariants(), "shrink-0")}
          href="/dashboard/categorias/nova"
        >
          Nova categoria
        </Link>
      </section>
      <div className="grid gap-4">
        {categories.map((category) => {
          const hasRelations =
            category._count.children > 0 ||
            category._count.points > 0 ||
            category._count.studyMaterials > 0;

          return (
            <Card className="p-5" key={category.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {category.parent ? `${category.parent.name} / ` : ""}
                      {category.name}
                    </h2>
                    <Badge>{categoryTypeLabels[category.type]}</Badge>
                    {category.parentId ? (
                      <Badge className="bg-card">Subcategoria</Badge>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <MetaGroup
                      label="Subcategorias"
                      value={String(category._count.children)}
                    />
                    <MetaGroup
                      label="Materiais"
                      value={String(category._count.studyMaterials)}
                    />
                    <MetaGroup
                      label="Pontos"
                      value={String(category._count.points)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={cn(buttonVariants({ variant: "outline" }))}
                    href={`/dashboard/categorias/${category.id}`}
                  >
                    Editar
                  </Link>
                  {!hasRelations ? (
                    <form
                      action={async () => {
                        "use server";
                        await deleteCategoryAction({ id: category.id });
                      }}
                    >
                      <Button type="submit" variant="secondary">
                        Excluir
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MetaGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">{value}</p>
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
