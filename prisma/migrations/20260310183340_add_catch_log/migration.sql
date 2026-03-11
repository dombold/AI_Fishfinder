-- CreateTable
CREATE TABLE "catch_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "species" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catch_logs_userId_idx" ON "catch_logs"("userId");

-- AddForeignKey
ALTER TABLE "catch_logs" ADD CONSTRAINT "catch_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
