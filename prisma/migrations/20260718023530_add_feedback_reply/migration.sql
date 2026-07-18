-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "adminReply" TEXT,
ADD COLUMN     "adminReplyAt" TIMESTAMP(3),
ADD COLUMN     "replyReadAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
