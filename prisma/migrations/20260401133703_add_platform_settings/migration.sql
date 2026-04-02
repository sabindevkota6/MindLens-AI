-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "suspendWarnAt" INTEGER NOT NULL DEFAULT 7,
    "autoSuspendAt" INTEGER NOT NULL DEFAULT 10,
    "autoSuspendDays" INTEGER NOT NULL DEFAULT 5,
    "banWarnAt" INTEGER NOT NULL DEFAULT 15,
    "autoBanAt" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
