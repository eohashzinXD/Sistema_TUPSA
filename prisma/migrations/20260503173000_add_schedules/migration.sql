CREATE TYPE "ScheduleType" AS ENUM ('FESTAS', 'AMACIS', 'GIRAS');

CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "schedules_type_year_month_key" ON "schedules"("type", "year", "month");

CREATE INDEX "schedules_year_month_idx" ON "schedules"("year", "month");

CREATE INDEX "schedules_createdById_idx" ON "schedules"("createdById");

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
