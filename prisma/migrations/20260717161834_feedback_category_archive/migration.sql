-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('INCOMING', 'BUG', 'LOVE');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "category" "FeedbackCategory" NOT NULL DEFAULT 'INCOMING';
