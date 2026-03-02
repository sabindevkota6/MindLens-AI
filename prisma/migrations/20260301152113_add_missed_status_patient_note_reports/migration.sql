-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'MISSED';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelledBy" "Role",
ADD COLUMN     "patientNote" TEXT;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "counselorProfileId" TEXT NOT NULL,
    "patientProfileId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_counselorProfileId_idx" ON "Report"("counselorProfileId");

-- CreateIndex
CREATE INDEX "Report_patientProfileId_idx" ON "Report"("patientProfileId");

-- CreateIndex
CREATE INDEX "Appointment_patientProfileId_status_idx" ON "Appointment"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "Appointment_counselorProfileId_status_idx" ON "Appointment"("counselorProfileId", "status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_counselorProfileId_fkey" FOREIGN KEY ("counselorProfileId") REFERENCES "CounselorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
