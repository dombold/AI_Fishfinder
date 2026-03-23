-- CreateTable
CREATE TABLE "catch_log_shared_groups" (
    "id" TEXT NOT NULL,
    "catchLogId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catch_log_shared_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catch_log_shared_groups_catchLogId_idx" ON "catch_log_shared_groups"("catchLogId");

-- CreateIndex
CREATE INDEX "catch_log_shared_groups_groupId_idx" ON "catch_log_shared_groups"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "catch_log_shared_groups_catchLogId_groupId_key" ON "catch_log_shared_groups"("catchLogId", "groupId");

-- AddForeignKey
ALTER TABLE "catch_log_shared_groups" ADD CONSTRAINT "catch_log_shared_groups_catchLogId_fkey" FOREIGN KEY ("catchLogId") REFERENCES "catch_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catch_log_shared_groups" ADD CONSTRAINT "catch_log_shared_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
