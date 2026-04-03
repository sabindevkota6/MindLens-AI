-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'credentials',
ALTER COLUMN "passwordHash" DROP NOT NULL;
