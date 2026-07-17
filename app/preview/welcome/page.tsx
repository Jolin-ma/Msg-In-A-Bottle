import WelcomePanel from "@/components/WelcomePanel";

interface PreviewWelcomePageProps {
  searchParams: Promise<{ bottle?: string; name?: string }>;
}

export default async function PreviewWelcomePage({
  searchParams,
}: PreviewWelcomePageProps) {
  const { bottle, name } = await searchParams;

  return (
    <WelcomePanel
      name={name ?? "Alex"}
      slug={bottle ?? "tidewater-echoes"}
      isPublic
    />
  );
}
