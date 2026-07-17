import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import WelcomePanel from "@/components/WelcomePanel";

export const dynamic = "force-dynamic";

interface WelcomePageProps {
  searchParams: Promise<{ bottle?: string; public?: string }>;
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const { bottle, public: publicParam } = await searchParams;

  return (
    <WelcomePanel
      name={session.user.name ?? session.user.email ?? null}
      slug={bottle || null}
      isPublic={publicParam !== "false"}
    />
  );
}
