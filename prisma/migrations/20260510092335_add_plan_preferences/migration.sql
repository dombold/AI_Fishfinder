-- AlterTable
ALTER TABLE "fishing_sessions" ADD COLUMN     "maxDepthM" INTEGER,
ADD COLUMN     "maxDistanceKm" DOUBLE PRECISION,
ADD COLUMN     "planInstructions" TEXT;
