ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);

INSERT INTO "permissions" ("id", "key", "description")
VALUES
  (concat('perm_', replace(gen_random_uuid()::text, '-', '')), 'board:read', 'Visualizar diretoria da casa'),
  (concat('perm_', replace(gen_random_uuid()::text, '-', '')), 'birthdays:read', 'Visualizar aniversariantes do mês')
ON CONFLICT ("key") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "roles" ("id", "name", "description")
VALUES
  (concat('role_', replace(gen_random_uuid()::text, '-', '')), 'pai-pequeno', 'Apoio direto à administração espiritual e operacional da casa'),
  (concat('role_', replace(gen_random_uuid()::text, '-', '')), 'mãe-pequena', 'Apoio direto à administração espiritual e operacional da casa')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT "roles"."id", "permissions"."id"
FROM "roles"
CROSS JOIN "permissions"
WHERE "roles"."name" IN ('pai-de-santo', 'pai-pequeno', 'mãe-pequena')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT "roles"."id", "permissions"."id"
FROM "roles"
CROSS JOIN "permissions"
WHERE "roles"."name" IN ('filho-de-santo', 'curimba')
  AND "permissions"."key" IN ('board:read', 'birthdays:read')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
