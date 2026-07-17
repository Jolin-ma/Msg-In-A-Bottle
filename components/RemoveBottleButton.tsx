"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RemoveBottleButton.module.css";

interface RemoveBottleButtonProps {
  slug: string;
  hasMessages: boolean;
}

export default function RemoveBottleButton({
  slug,
  hasMessages,
}: RemoveBottleButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      hasMessages
        ? "Remove this bottle from your dashboard? It's a two-way exchange, so it won't be deleted — the link and any replies stay live for whoever has it, you just won't manage it here anymore."
        : "Delete this empty bottle? This can't be undone.",
    );
    if (!confirmed) return;

    setPending(true);
    try {
      await fetch(`/api/rooms/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
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
      aria-label={hasMessages ? "Remove from dashboard" : "Delete bottle"}
      title={hasMessages ? "Remove from dashboard" : "Delete bottle"}
    >
      ×
    </button>
  );
}
