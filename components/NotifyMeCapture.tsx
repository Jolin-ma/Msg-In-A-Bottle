"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./NotifyMeCapture.module.css";

interface NotifyMeCaptureProps {
  slug: string;
  onDone: () => void;
}

export default function NotifyMeCapture({ slug, onDone }: NotifyMeCaptureProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function skip() {
    window.localStorage.setItem(`bottle-notify-skip:${slug}`, "1");
    onDone();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${slug}/visitor-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        setError("That didn't look like an email.");
        setPending(false);
        return;
      }
      onDone();
    } catch {
      setError("Couldn't save that. Try again.");
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.prompt}>Want an email when they reply?</p>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          disabled={pending}
        />
        <button type="submit" className={styles.submit} disabled={pending || !email.trim()}>
          notify me
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.altRow}>
        <button type="button" className={styles.skip} onClick={skip} disabled={pending}>
          no thanks
        </button>
        <span className={styles.divider} aria-hidden="true">
          ·
        </span>
        <Link href="/" className={styles.createAccount}>
          create an account instead
        </Link>
      </div>
    </form>
  );
}
