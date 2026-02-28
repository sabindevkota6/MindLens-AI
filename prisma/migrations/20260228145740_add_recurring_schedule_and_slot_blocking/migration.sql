-- AlterTable
ALTER TABLE "AvailabilitySlot" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RecurringSchedule" (
    "id" TEXT NOT NULL,
    "counselorProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "RecurringSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringSchedule_counselorProfileId_idx" ON "RecurringSchedule"("counselorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSchedule_counselorProfileId_dayOfWeek_startTime_key" ON "RecurringSchedule"("counselorProfileId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_counselorProfileId_startTime_idx" ON "AvailabilitySlot"("counselorProfileId", "startTime");

-- AddForeignKey
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_counselorProfileId_fkey" FOREIGN KEY ("counselorProfileId") REFERENCES "CounselorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
