-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "attachedEmotionLogId" TEXT,
ADD COLUMN     "medicalConcern" TEXT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_attachedEmotionLogId_fkey" FOREIGN KEY ("attachedEmotionLogId") REFERENCES "EmotionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
