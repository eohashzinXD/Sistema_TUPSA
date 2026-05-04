DROP INDEX IF EXISTS "schedules_type_year_key";
DROP INDEX IF EXISTS "schedules_year_idx";

ALTER TABLE "schedules" ADD COLUMN "month" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "schedules_type_year_month_key" ON "schedules"("type", "year", "month");
CREATE INDEX "schedules_year_month_idx" ON "schedules"("year", "month");
