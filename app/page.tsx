import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRandomPublicRoomSlugs } from "@/lib/rooms";
import AuthForm from "@/components/AuthForm";
import BottlePhysics from "@/components/BottlePhysics";
import ContactInfo from "@/components/ContactInfo";

export const dynamic = "force-dynamic";

const DECORATIVE_BOTTLE_COUNT = 7;

export default async function HeroPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const bottleSlugs = await getRandomPublicRoomSlugs(DECORATIVE_BOTTLE_COUNT);

  return (
    <>
      <BottlePhysics bottleSlugs={bottleSlugs} />
      <AuthForm />
      <ContactInfo />
    </>
  );
}
