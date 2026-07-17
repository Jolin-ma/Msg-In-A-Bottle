"use client";

import { useRouter } from "next/navigation";
import styles from "./RoomSlugMarker.module.css";

interface RoomSlugMarkerProps {
  ownerName?: string | null;
  roomPrompt?: string | null;
}

export default function RoomSlugMarker({
  ownerName = null,
  roomPrompt = null,
}: RoomSlugMarkerProps) {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.exit}
        onClick={() => router.push("/dashboard")}
        aria-label="Back to bottles"
        title="Back to bottles"
      >
        <span className={styles.arrow} aria-hidden="true">
          ←
        </span>
        <span className={styles.bottleColumn}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bottle.png" alt="" className={styles.bottleIcon} />
          <span className={styles.exitLabel}>back to dashboard</span>
        </span>
      </button>

      {(ownerName || roomPrompt) && (
        <div className={styles.caption}>
          {ownerName && <span className={styles.ownerName}>{ownerName}&rsquo;s bottle</span>}
          {roomPrompt && <span className={styles.prompt}>{roomPrompt}</span>}
        </div>
      )}
    </div>
  );
}
