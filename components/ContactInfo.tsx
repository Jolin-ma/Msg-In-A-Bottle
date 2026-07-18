"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./ContactInfo.module.css";

interface FeedbackThread {
  id: string;
  text: string;
  adminReply: string | null;
  adminReplyAt: string | null;
  replyReadAt: string | null;
  createdAt: string;
}

function isUnread(entry: FeedbackThread): boolean {
  return (
    Boolean(entry.adminReply) &&
    (!entry.replyReadAt ||
      (entry.adminReplyAt !== null && entry.replyReadAt < entry.adminReplyAt))
  );
}

export default function ContactInfo() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<FeedbackThread[]>([]);

  useEffect(() => {
    fetch("/api/feedback/mine")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: FeedbackThread[]) => setThreads(data))
      .catch(() => {});
  }, []);

  const hasUnreadReply = threads.some(isUnread);
  const repliedThreads = threads.filter((entry) => entry.adminReply);

  function handleOpen() {
    setOpen(true);

    const unread = threads.filter(isUnread);
    if (unread.length === 0) return;

    setThreads((current) =>
      current.map((entry) =>
        isUnread(entry) ? { ...entry, replyReadAt: new Date().toISOString() } : entry,
      ),
    );
    unread.forEach((entry) => {
      fetch(`/api/feedback/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markRead: true }),
      }).catch(() => {});
    });
  }

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
        body: JSON.stringify({ text: trimmed }),
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
      <button type="button" className={styles.trigger} onClick={handleOpen}>
        Questions or feedback? Get in touch
        {hasUnreadReply && <span className={styles.unreadDot} aria-label="new reply" />}
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

            {repliedThreads.length > 0 && (
              <div className={styles.replies}>
                {repliedThreads.map((thread) => (
                  <div key={thread.id} className={styles.replyThread}>
                    <p className={styles.replyQuestion}>You asked: “{thread.text}”</p>
                    <p className={styles.replyText}>{thread.adminReply}</p>
                  </div>
                ))}
              </div>
            )}

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
