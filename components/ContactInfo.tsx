"use client";

import { useState, type FormEvent } from "react";
import styles from "./ContactInfo.module.css";

export default function ContactInfo() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, contactEmail: email.trim() || undefined }),
      });
      if (!response.ok) {
        setError("Couldn't send that. Try again.");
        setPending(false);
        return;
      }
      setSent(true);
      setPending(false);
    } catch {
      setError("Couldn't send that. Try again.");
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.sent}>Thanks — got it.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={styles.wrapper}>
        <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
          Questions or feedback? Get in touch
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What's on your mind?"
          rows={2}
          maxLength={1000}
          autoFocus
        />
        <div className={styles.row}>
          <input
            className={styles.email}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your email (optional, for a reply)"
            autoComplete="email"
          />
          <button type="submit" className={styles.submit} disabled={pending || !text.trim()}>
            Send
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
