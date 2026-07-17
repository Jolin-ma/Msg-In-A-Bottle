"use client";

import { useRouter } from "next/navigation";
import { goToRandomBottle } from "@/lib/randomBottle";
import styles from "./BottleReleased.module.css";

interface BottleReleasedProps {
  isPublic: boolean;
}

export default function BottleReleased({ isPublic }: BottleReleasedProps) {
  const router = useRouter();

  return (
    <div className={styles.panel}>
      <p className={styles.message}>
        {isPublic ? "Sent. Your words are back in the sea." : "Delivered."}
      </p>
      {isPublic && (
        <button
          type="button"
          className={styles.action}
          onClick={() => goToRandomBottle(router)}
        >
          [find another bottle]
        </button>
      )}
    </div>
  );
}
