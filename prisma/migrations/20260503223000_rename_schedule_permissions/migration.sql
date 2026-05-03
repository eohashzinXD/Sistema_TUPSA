UPDATE "permissions"
SET "key" = 'cronogramas:read',
    "description" = 'Visualizar cronogramas'
WHERE "key" = 'schedules:read';

UPDATE "permissions"
SET "key" = 'cronogramas:manage',
    "description" = 'Gerenciar cronogramas'
WHERE "key" = 'schedules:manage';

INSERT INTO "permissions" ("id", "key", "description")
VALUES (
  concat('perm_', replace(gen_random_uuid()::text, '-', '')),
  'functions:manage',
  'Gerenciar funções da casa'
)
ON CONFLICT ("key") DO UPDATE
SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT "roles"."id", "permissions"."id"
FROM "roles"
CROSS JOIN "permissions"
WHERE "roles"."name" = 'pai-de-santo'
  AND "permissions"."key" = 'functions:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
