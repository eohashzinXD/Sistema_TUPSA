DELETE FROM "schedules"
WHERE "id" IN (
    SELECT "id"
    FROM (
        SELECT
            "id",
            ROW_NUMBER() OVER (
                PARTITION BY "type", "year"
                ORDER BY "updatedAt" DESC, "createdAt" DESC
            ) AS "rowNumber"
        FROM "schedules"
    ) AS "rankedSchedules"
    WHERE "rowNumber" > 1
);

DROP INDEX IF EXISTS "schedules_type_year_month_key";
DROP INDEX IF EXISTS "schedules_year_month_idx";

ALTER TABLE "schedules" DROP COLUMN "month";

CREATE UNIQUE INDEX "schedules_type_year_key" ON "schedules"("type", "year");
CREATE INDEX "schedules_year_idx" ON "schedules"("year");
