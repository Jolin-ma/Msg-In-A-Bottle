"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./WelcomePanel.module.css";

interface WelcomePanelProps {
  name: string | null;
  slug: string | null;
}

export default function WelcomePanel({ name, slug }: WelcomePanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!slug) return;
    const link = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — nothing to do
    }
  }

  return (
    <div className={styles.page}>
      {slug ? (
        <>
          <p className={styles.heading}>Your bottle is ready.</p>
          <p className={styles.body}>
            It&apos;s sealed just for whoever has this link. Send it to a friend.
          </p>
          <div className={styles.linkRow}>
            <span className={styles.link}>/{slug}</span>
            <button type="button" className={styles.copy} onClick={handleCopy}>
              {copied ? "copied" : "copy link"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.heading}>{name ? `Welcome, ${name}.` : "Welcome."}</p>
          <p className={styles.body}>Your bottles are waiting.</p>
        </>
      )}
      <Link href="/dashboard" className={styles.continue}>
        Continue to your bottles
      </Link>
    </div>
  );
}
