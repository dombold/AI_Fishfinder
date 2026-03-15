-- AlterTable
ALTER TABLE "catch_logs" ADD COLUMN     "bioregion" TEXT;

-- CreateTable
CREATE TABLE "inat_observations" (
    "id" TEXT NOT NULL,
    "taxonName" TEXT NOT NULL,
    "appSpecies" TEXT,
    "bioregion" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "observedOn" TEXT NOT NULL,
    "qualityGrade" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inat_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crowd_source_summaries" (
    "id" TEXT NOT NULL,
    "bioregion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summaryJson" TEXT NOT NULL,

    CONSTRAINT "crowd_source_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inat_observations_bioregion_idx" ON "inat_observations"("bioregion");

-- CreateIndex
CREATE INDEX "inat_observations_bioregion_appSpecies_idx" ON "inat_observations"("bioregion", "appSpecies");

-- CreateIndex
CREATE INDEX "inat_observations_observedOn_idx" ON "inat_observations"("observedOn");

-- CreateIndex
CREATE UNIQUE INDEX "crowd_source_summaries_bioregion_key" ON "crowd_source_summaries"("bioregion");

-- CreateIndex
CREATE INDEX "catch_logs_bioregion_idx" ON "catch_logs"("bioregion");

-- CreateIndex
CREATE INDEX "catch_logs_bioregion_species_idx" ON "catch_logs"("bioregion", "species");
