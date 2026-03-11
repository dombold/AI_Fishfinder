-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sounderType" TEXT NOT NULL DEFAULT 'GARMIN',
    "seasicknessTolerance" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "fishingType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_species" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speciesName" TEXT NOT NULL,

    CONSTRAINT "selected_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marine_data" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "willyWeatherData" TEXT NOT NULL,
    "openMeteoData" TEXT NOT NULL,
    "tideData" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marine_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_plans" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "planContent" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fishing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "fishing_sessions_userId_idx" ON "fishing_sessions"("userId");

-- CreateIndex
CREATE INDEX "selected_species_sessionId_idx" ON "selected_species"("sessionId");

-- CreateIndex
CREATE INDEX "marine_data_sessionId_idx" ON "marine_data"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "marine_data_sessionId_date_key" ON "marine_data"("sessionId", "date");

-- CreateIndex
CREATE INDEX "fishing_plans_sessionId_idx" ON "fishing_plans"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "fishing_plans_sessionId_date_key" ON "fishing_plans"("sessionId", "date");

-- AddForeignKey
ALTER TABLE "fishing_sessions" ADD CONSTRAINT "fishing_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_species" ADD CONSTRAINT "selected_species_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "fishing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marine_data" ADD CONSTRAINT "marine_data_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "fishing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_plans" ADD CONSTRAINT "fishing_plans_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "fishing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
