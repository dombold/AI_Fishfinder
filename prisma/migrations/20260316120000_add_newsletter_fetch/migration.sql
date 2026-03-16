-- AlterTable: add source field to catch_logs
ALTER TABLE "catch_logs" ADD COLUMN "source" TEXT;

-- CreateTable: newsletter_fetches (deduplication tracking)
CREATE TABLE "newsletter_fetches" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedDate" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observationCount" INTEGER NOT NULL,

    CONSTRAINT "newsletter_fetches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_fetches_url_key" ON "newsletter_fetches"("url");
