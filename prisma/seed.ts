import { CategoryType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  ["dashboard:read", "Acessar o painel interno"],
  ["study:read", "Visualizar materiais de estudo"],
  ["study:create", "Criar materiais de estudo"],
  ["study:update", "Editar materiais de estudo"],
  ["study:delete", "Remover materiais de estudo"],
  ["points:read", "Visualizar pontos cantados"],
  ["points:create", "Criar pontos cantados"],
  ["points:update", "Editar pontos cantados"],
  ["points:delete", "Remover pontos cantados"],
  ["functions:read", "Visualizar funções da casa"],
  ["functions:create", "Criar funções da casa"],
  ["amaci:read", "Visualizar controle de amaci"],
  ["amaci:manage", "Gerenciar amaci dos filhos"],
  ["monthly-fees:read", "Visualizar mensalidades"],
  ["monthly-fees:manage", "Gerenciar mensalidades dos filhos"],
  ["schedules:read", "Visualizar cronogramas mensais"],
  ["schedules:manage", "Gerenciar cronogramas mensais"],
  ["categories:manage", "Gerenciar categorias e subcategorias"],
  ["notifications:read", "Visualizar comunicados"],
  ["notifications:create", "Enviar comunicados internos"],
  ["users:manage", "Gerenciar usuários, papéis, grupos e permissões"]
] as const;

const roleDefinitions = [
  {
    name: "pai-de-santo",
    description: "Administração espiritual e operacional da casa",
    permissions: permissions.map(([key]) => key)
  },
  {
    name: "filho-de-santo",
    description: "Membro da corrente com acesso aos conteúdos gerais",
    permissions: [
      "dashboard:read",
      "study:read",
      "points:read",
      "functions:read",
      "amaci:read",
      "schedules:read",
      "monthly-fees:read",
      "notifications:read"
    ]
  },
  {
    name: "curimba",
    description: "Membro responsável pelos pontos e condução musical",
    permissions: [
      "dashboard:read",
      "points:read",
      "points:create",
      "points:update",
      "points:delete",
      "functions:read",
      "amaci:read",
      "schedules:read",
      "monthly-fees:read",
      "notifications:read"
    ]
  }
] as const;

const groups = [
  ["corrente-mediunica", "Grupo geral da corrente mediúnica"],
  ["curimba", "Grupo de estudo e organização da curimba"],
  ["desenvolvimento", "Grupo de desenvolvimento mediúnico"]
] as const;

const categories = [
  { name: "Fundamentos", type: CategoryType.STUDY },
  { name: "Doutrina", type: CategoryType.STUDY },
  { name: "Ervas e defumações", type: CategoryType.STUDY },
  { name: "Abertura", type: CategoryType.POINT },
  { name: "Defumação", type: CategoryType.POINT },
  { name: "Andamento de Gira", type: CategoryType.POINT },
  { name: "Encerramento", type: CategoryType.POINT }
] as const;

async function main() {
  const createdPermissions = new Map<string, string>();

  for (const [key, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });

    createdPermissions.set(key, permission.id);
  }

  for (const roleDefinition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: { description: roleDefinition.description },
      create: {
        name: roleDefinition.name,
        description: roleDefinition.description
      }
    });

    for (const permissionKey of roleDefinition.permissions) {
      const permissionId = createdPermissions.get(permissionKey);

      if (!permissionId) {
        throw new Error(`Permission not found for seed: ${permissionKey}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId
        }
      });
    }
  }

  for (const [name, description] of groups) {
    await prisma.group.upsert({
      where: { name },
      update: { description },
      create: { name, description }
    });
  }

  for (const category of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: category.type,
        parentId: null
      }
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: category
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "pai-de-santo" }
  });

  const adminPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456",
    12
  );

  const adminUser = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@casa.local" },
    update: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador da Casa",
      active: true
    },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador da Casa",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@casa.local",
      password: adminPassword,
      active: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
