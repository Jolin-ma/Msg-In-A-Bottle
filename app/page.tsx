import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import BottlePhysics from "@/components/BottlePhysics";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <BottlePhysics />
      <AuthForm />
    </>
  );
}
