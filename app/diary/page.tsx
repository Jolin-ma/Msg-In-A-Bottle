import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDiaryEntries } from "@/lib/diary";
import DiaryView from "@/components/DiaryView";

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const entries = await getDiaryEntries(session.user.id);

  return (
    <DiaryView
      initialEntries={entries.map((entry) => ({
        id: entry.id,
        text: entry.text,
        createdAt: entry.createdAt.toISOString(),
      }))}
    />
  );
}
