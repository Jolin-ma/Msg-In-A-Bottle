-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
