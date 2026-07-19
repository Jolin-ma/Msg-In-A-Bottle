"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./WipeDataButton.module.css";

export default function WipeDataButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "Permanently wipe your diary entries and bottles? This can't be undone. Your account stays signed in — any bottle already replied to stays live at its link, just no longer owned by you.",
    );
    if (!confirmed) return;

    setPending(true);
    try {
      await fetch("/api/account/wipe", { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={pending}
    >
      Wipe My Data
    </button>
  );
}
