"use client";

import { useState, type FocusEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { sanitizeSlug } from "@/lib/slug";
import styles from "./RoomSlugMarker.module.css";

interface RoomSlugMarkerProps {
  slug: string;
  ownerName?: string | null;
  roomPrompt?: string | null;
}

export default function RoomSlugMarker({
  slug,
  ownerName = null,
  roomPrompt = null,
}: RoomSlugMarkerProps) {
  const router = useRouter();
  const [value, setValue] = useState(slug);

  function navigateIfChanged() {
    const sanitized = sanitizeSlug(value);
    if (!sanitized || sanitized === slug) {
      setValue(slug);
      return;
    }
    router.push(`/${sanitized}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  function handleBlur(_event: FocusEvent<HTMLInputElement>) {
    navigateIfChanged();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.marker}>
        <button
          type="button"
          className={styles.exit}
          onClick={() => router.push("/dashboard")}
          aria-label="Back to bottles"
          title="Back to bottles"
        >
          ←
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bottle.png" alt="" className={styles.bottleIcon} />
        </button>
        <span className={styles.prefix}>yoursite.com/</span>
        <input
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {(ownerName || roomPrompt) && (
        <div className={styles.caption}>
          {ownerName && <span className={styles.ownerName}>{ownerName}&rsquo;s bottle</span>}
          {roomPrompt && <span className={styles.prompt}>{roomPrompt}</span>}
        </div>
      )}
    </div>
  );
}
