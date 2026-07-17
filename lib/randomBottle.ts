import { customAlphabet } from "nanoid";
import type { useRouter } from "next/navigation";

const generateSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export async function goToRandomBottle(
  router: ReturnType<typeof useRouter>,
): Promise<void> {
  try {
    const response = await fetch("/api/rooms/random");
    if (response.ok) {
      const room: { slug: string } = await response.json();
      router.push(`/${room.slug}`);
      return;
    }
  } catch {
    // network failure: fall through to self-heal below
  }
  router.push(`/${generateSlug()}`);
}
