"use client";

import { useEffect, useMemo, useState } from "react";
import LiveFeedbackStream from "./LiveFeedbackStream";
import styles from "./OperationsDashboard.module.css";

type FeedbackStatus = "NEW" | "READ" | "RESOLVED";
type FeedbackCategory = "INCOMING" | "BUG" | "LOVE";

export interface FeedbackEntry {
  id: string;
  text: string;
  contactEmail: string | null;
  status: FeedbackStatus;
  category: FeedbackCategory;
  archivedAt: string | null;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  adminReply: string | null;
}

const POLL_INTERVAL_MS = 10000;

const BAYS: { key: FeedbackCategory; label: string; hint: string }[] = [
  { key: "INCOMING", label: "Incoming", hint: "not yet sorted" },
  { key: "BUG", label: "Bugs & technical", hint: "needs a fix" },
  { key: "LOVE", label: "Love & inspiration", hint: "worth keeping" },
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OperationsDashboard({
  initialFeedback,
}: {
  initialFeedback: FeedbackEntry[];
}) {
  const [entries, setEntries] = useState(initialFeedback);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/feedback")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: FeedbackEntry[] | null) => {
          if (data) setEntries(data);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const active = useMemo(() => entries.filter((e) => !e.archivedAt), [entries]);
  const archived = useMemo(() => entries.filter((e) => e.archivedAt), [entries]);

  const counts = useMemo(
    () => ({
      total: entries.length,
      unread: entries.filter((e) => e.status === "NEW").length,
      resolved: entries.filter((e) => e.status === "RESOLVED").length,
    }),
    [entries],
  );

  const incoming = useMemo(
    () => active.filter((e) => e.category === "INCOMING"),
    [active],
  );

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  function applyLocal(id: string, patchData: Partial<FeedbackEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patchData } : entry)),
    );
  }

  function setStatus(id: string, status: FeedbackStatus) {
    applyLocal(id, { status });
    patch(id, { status });
  }

  function moveTo(id: string, category: FeedbackCategory) {
    applyLocal(id, { category });
    patch(id, { category });
  }

  function setArchived(id: string, archived: boolean) {
    applyLocal(id, { archivedAt: archived ? new Date().toISOString() : null });
    patch(id, { archived });
  }

  async function sendReply(id: string) {
    const reply = (replyDrafts[id] ?? "").trim();
    if (!reply) return;
    setSendingReplyId(id);
    try {
      await patch(id, { reply });
      applyLocal(id, { adminReply: reply });
      setReplyDrafts((current) => ({ ...current, [id]: "" }));
    } finally {
      setSendingReplyId(null);
    }
  }

  function handleExpand(entry: FeedbackEntry) {
    const opening = expandedId !== entry.id;
    setExpandedId(opening ? entry.id : null);
    if (opening && entry.status === "NEW") {
      setStatus(entry.id, "READ");
    }
  }

  function renderCard(entry: FeedbackEntry) {
    const expanded = expandedId === entry.id;
    return (
      <article
        key={entry.id}
        className={`${styles.card} ${styles[`status${entry.status}`]}`}
      >
        <button
          type="button"
          className={styles.cardHead}
          onClick={() => handleExpand(entry)}
          aria-expanded={expanded}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.cardTimestamp}>{formatTimestamp(entry.createdAt)}</span>
          <span className={styles.cardPreview}>{expanded ? "" : entry.text}</span>
        </button>

        {expanded && (
          <div className={styles.cardBody}>
            <p className={styles.cardText}>{entry.text}</p>
            <span className={styles.cardSource}>
              {entry.userEmail
                ? `${entry.userEmail} — reply shows in-app`
                : entry.contactEmail
                  ? `reply to: ${entry.contactEmail}`
                  : "anonymous"}
            </span>

            {entry.adminReply && (
              <div className={styles.replySent}>
                <span className={styles.replySentLabel}>your reply</span>
                <p className={styles.replySentText}>{entry.adminReply}</p>
              </div>
            )}

            {(entry.userId || entry.contactEmail) && (
              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyInput}
                  value={replyDrafts[entry.id] ?? ""}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({ ...current, [entry.id]: event.target.value }))
                  }
                  placeholder={entry.adminReply ? "Update your reply..." : "Write a reply..."}
                  rows={2}
                  maxLength={1000}
                />
                <div className={styles.replyFormRow}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => sendReply(entry.id)}
                    disabled={
                      sendingReplyId === entry.id || !(replyDrafts[entry.id] ?? "").trim()
                    }
                  >
                    {entry.adminReply ? "update reply" : "send reply"}
                  </button>
                  {!entry.userId && (
                    <span className={styles.replyFormHint}>
                      no account — saved here, send it via email yourself
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.cardActions}>
              {BAYS.filter((bay) => bay.key !== entry.category).map((bay) => (
                <button
                  key={bay.key}
                  type="button"
                  className={styles.actionButton}
                  onClick={() => moveTo(entry.id, bay.key)}
                >
                  move to {bay.label.toLowerCase()}
                </button>
              ))}
              {entry.status !== "RESOLVED" ? (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => setStatus(entry.id, "RESOLVED")}
                >
                  mark resolved
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => setStatus(entry.id, "READ")}
                >
                  reopen
                </button>
              )}
              <button
                type="button"
                className={styles.actionButtonQuiet}
                onClick={() => setArchived(entry.id, true)}
              >
                archive
              </button>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Feedback</h1>
        <p className={styles.subtitle}>Notes from the sea, sorted.</p>
      </header>

      <section className={styles.gauges}>
        <div className={styles.gauge}>
          <span className={styles.gaugeValue}>{counts.total}</span>
          <span className={styles.gaugeLabel}>received</span>
        </div>
        <div className={styles.gauge}>
          <span className={`${styles.gaugeValue} ${counts.unread > 0 ? styles.gaugeUnread : ""}`}>
            {counts.unread}
          </span>
          <span className={styles.gaugeLabel}>unread</span>
        </div>
        <div className={styles.gauge}>
          <span className={styles.gaugeValue}>{counts.resolved}</span>
          <span className={styles.gaugeLabel}>resolved</span>
        </div>
      </section>

      <LiveFeedbackStream items={incoming.map((e) => ({ id: e.id }))} />

      <section className={styles.bays}>
        {BAYS.map((bay) => {
          const items = active.filter((e) => e.category === bay.key);
          return (
            <div key={bay.key} className={styles.bay}>
              <div className={styles.bayHead}>
                <span className={styles.bayLabel}>{bay.label}</span>
                <span className={styles.bayCount}>{items.length}</span>
              </div>
              <div className={styles.bayHint}>{bay.hint}</div>
              <div className={styles.bayCards}>
                {items.length === 0 && <p className={styles.bayEmpty}>Nothing here.</p>}
                {items.map(renderCard)}
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.archiveSection}>
        <button
          type="button"
          className={styles.archiveToggle}
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Hide" : "Show"} archive ({archived.length})
        </button>
        {showArchived && (
          <div className={styles.archiveList}>
            {archived.length === 0 && <p className={styles.bayEmpty}>Nothing archived.</p>}
            {archived.map((entry) => (
              <div key={entry.id} className={styles.archiveRow}>
                <span className={styles.cardTimestamp}>{formatTimestamp(entry.createdAt)}</span>
                <span className={styles.cardPreview}>{entry.text}</span>
                <button
                  type="button"
                  className={styles.actionButtonQuiet}
                  onClick={() => setArchived(entry.id, false)}
                >
                  restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
