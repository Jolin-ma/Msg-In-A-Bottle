"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./ContactInfo.module.css";

export default function ContactInfo() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setText("");
    setEmail("");
    setError(null);
    setSent(false);
  }

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

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        Questions or feedback? Get in touch
      </button>

      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>

            {sent ? (
              <p className={styles.sent}>Thanks — got it.</p>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h2 className={styles.heading}>Get in touch</h2>
                <textarea
                  className={styles.textarea}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  maxLength={1000}
                  autoFocus
                />
                <input
                  className={styles.email}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your email (optional, for a reply)"
                  autoComplete="email"
                />
                {error && <p className={styles.error}>{error}</p>}
                <button
                  type="submit"
                  className={styles.submit}
                  disabled={pending || !text.trim()}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
