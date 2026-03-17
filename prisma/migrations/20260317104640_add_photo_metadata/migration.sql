-- AlterTable
ALTER TABLE "catch_logs" ADD COLUMN     "captureTime" TEXT,
ADD COLUMN     "environment" TEXT,
ADD COLUMN     "fishCount" INTEGER,
ADD COLUMN     "fishingMethod" TEXT;
