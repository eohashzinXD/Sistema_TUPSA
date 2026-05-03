ALTER TABLE "users"
  ADD COLUMN "maritalStatus" TEXT,
  ADD COLUMN "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allergies" TEXT,
  ADD COLUMN "usesContinuousMedication" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "continuousMedication" TEXT,
  ADD COLUMN "umbandaStartDate" TIMESTAMP(3),
  ADD COLUMN "adjuntoOrixa" TEXT,
  ADD COLUMN "frontEntity" TEXT,
  ADD COLUMN "baptismDate" TIMESTAMP(3),
  ADD COLUMN "coronationDate" TIMESTAMP(3),
  ADD COLUMN "rightObligations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "leftObligations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
