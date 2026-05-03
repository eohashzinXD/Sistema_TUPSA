CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'terreiro',
    "templeName" TEXT NOT NULL DEFAULT 'TUPSA',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_settings" ("id", "templeName", "updatedAt")
VALUES ('terreiro', 'TUPSA', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
