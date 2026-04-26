DO $$ BEGIN
  CREATE TYPE "AllocationStrategy" AS ENUM ('FIFO', 'LIFO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "defaultReorderPoint" INTEGER NOT NULL DEFAULT 10,
  "lowStockBuffer" INTEGER NOT NULL DEFAULT 0,
  "allocationStrategy" "AllocationStrategy" NOT NULL DEFAULT 'FIFO',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SystemSetting" ("id", "defaultReorderPoint", "lowStockBuffer", "allocationStrategy", "updatedAt")
VALUES (1, 10, 0, 'FIFO', NOW())
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
