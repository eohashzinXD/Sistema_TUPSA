CREATE TABLE "user_observations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_observations_userId_createdAt_idx" ON "user_observations"("userId", "createdAt");
CREATE INDEX "user_observations_authorId_idx" ON "user_observations"("authorId");

ALTER TABLE "user_observations"
ADD CONSTRAINT "user_observations_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_observations"
ADD CONSTRAINT "user_observations_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
