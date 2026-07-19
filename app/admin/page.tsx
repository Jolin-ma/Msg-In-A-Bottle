import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAllFeedback } from "@/lib/feedback";
import { getUserCount } from "@/lib/users";
import OperationsDashboard from "@/components/OperationsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const [feedback, userCount] = await Promise.all([getAllFeedback(), getUserCount()]);

  return (
    <OperationsDashboard
      userCount={userCount}
      initialFeedback={feedback.map((entry) => ({
        id: entry.id,
        text: entry.text,
        contactEmail: entry.contactEmail,
        status: entry.status,
        category: entry.category,
        archivedAt: entry.archivedAt ? entry.archivedAt.toISOString() : null,
        createdAt: entry.createdAt.toISOString(),
        userId: entry.userId,
        userEmail: entry.user?.email ?? null,
        adminReply: entry.adminReply,
      }))}
    />
  );
}
