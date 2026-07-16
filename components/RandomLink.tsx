"use client";

import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
import styles from "./RandomLink.module.css";

const generateSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export default function RandomLink() {
  const router = useRouter();

  async function handleClick() {
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

  return (
    <button type="button" className={styles.link} onClick={handleClick}>
      [random]
    </button>
  );
}
