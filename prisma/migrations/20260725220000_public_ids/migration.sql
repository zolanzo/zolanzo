-- Public ID foundation (pre–Sprint 2 Work Kernel)

-- AlterTable profiles
ALTER TABLE "profiles" ADD COLUMN "worker_public_id" TEXT;
ALTER TABLE "profiles" ADD COLUMN "client_public_id" TEXT;
CREATE UNIQUE INDEX "profiles_worker_public_id_key" ON "profiles"("worker_public_id");
CREATE UNIQUE INDEX "profiles_client_public_id_key" ON "profiles"("client_public_id");

-- AlterTable organizations
ALTER TABLE "organizations" ADD COLUMN "public_id" TEXT;
UPDATE "organizations" AS o
SET "public_id" = 'ORG-2' || UPPER(SUBSTR(REPLACE(o."id", '-', ''), 1, 5))
WHERE o."public_id" IS NULL;
ALTER TABLE "organizations" ALTER COLUMN "public_id" SET NOT NULL;
CREATE UNIQUE INDEX "organizations_public_id_key" ON "organizations"("public_id");

-- CreateTable public_id_counters
CREATE TABLE "public_id_counters" (
    "key" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_id_counters_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "public_id_counters_entity_idx" ON "public_id_counters"("entity");
