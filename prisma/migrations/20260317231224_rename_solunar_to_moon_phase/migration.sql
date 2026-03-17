/*
  Warnings:

  - You are about to drop the column `solunarRating` on the `catch_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "catch_logs" DROP COLUMN "solunarRating",
ADD COLUMN     "moonPhase" TEXT;
