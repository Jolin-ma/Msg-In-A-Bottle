"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import styles from "./DeleteAccountButton.module.css";

export default function DeleteAccountButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "Permanently delete your account and wipe your diary entries? This can't be undone. Any bottles you created stay live at their link for whoever has it — you'll just no longer own or manage them.",
    );
    if (!confirmed) return;

    setPending(true);
    try {
      await fetch("/api/account", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } catch {
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
      Delete my account
    </button>
  );
}
