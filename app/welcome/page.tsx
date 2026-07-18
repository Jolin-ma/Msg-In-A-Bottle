import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import WelcomePanel from "@/components/WelcomePanel";

export const dynamic = "force-dynamic";

interface WelcomePageProps {
  searchParams: Promise<{ bottle?: string }>;
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const { bottle } = await searchParams;

  return (
    <WelcomePanel
      name={session.user.name ?? session.user.email ?? null}
      slug={bottle || null}
    />
  );
}
