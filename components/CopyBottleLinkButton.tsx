"use client";

import { useState } from "react";
import styles from "./CopyBottleLinkButton.module.css";

interface CopyBottleLinkButtonProps {
  slug: string;
}

export default function CopyBottleLinkButton({ slug }: CopyBottleLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const link = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — nothing to do
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-label="Copy shareable link"
      title="Copy shareable link"
    >
      {copied ? "copied" : "copy link"}
    </button>
  );
}
