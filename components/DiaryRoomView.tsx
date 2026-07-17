"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import PhysicsCanvas, { type PhysicsCanvasHandle } from "./PhysicsCanvas";
import BottleMessage from "./BottleMessage";
import RoomSlugMarker from "./RoomSlugMarker";
import styles from "./DiaryView.module.css";

export interface DiaryRoomEntry {
  id: string;
  text: string;
  createdAt: string;
}

export default function DiaryRoomView({
  slug,
  initialEntries,
  ownerName = null,
  roomPrompt = null,
}: {
  slug: string;
  initialEntries: DiaryRoomEntry[];
  ownerName?: string | null;
  roomPrompt?: string | null;
}) {
  const canvasRef = useRef<PhysicsCanvasHandle>(null);
  const composeRef = useRef<HTMLFormElement>(null);
  const [entries, setEntries] = useState(initialEntries);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const STAGGER_MS = 90;
    const timeouts = initialEntries.map((entry, index) =>
      window.setTimeout(() => {
        canvasRef.current?.spawnText(entry.text);
      }, index * STAGGER_MS),
    );
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    canvasRef.current?.spawnText(trimmed);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomSlug: slug, text: trimmed }),
      });

      if (!response.ok) {
        setError("Couldn't save that. Try again.");
        setPending(false);
        return;
      }

      const entry = await response.json();
      setEntries((current) => [...current, entry]);
      setValue("");
      setPending(false);
    } catch {
      setError("Couldn't save that. Try again.");
      setPending(false);
    }
  }

  return (
    <>
      <PhysicsCanvas
        ref={canvasRef}
        getCeilingY={() => composeRef.current?.getBoundingClientRect().top}
      />
      {entries.length > 0 && (
        <div className={styles.readingArea}>
          <BottleMessage messages={entries} />
        </div>
      )}
      <form ref={composeRef} className={styles.composeRow} onSubmit={handleSubmit}>
        <textarea
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            entries.length === 0 ? "Write your first entry..." : "Write today's entry..."
          }
          disabled={pending}
          rows={2}
        />
        <div className={styles.sendGroup}>
          <button type="submit" className={styles.submit} disabled={pending || !value.trim()}>
            add entry
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bottle.png" alt="" className={styles.bottleIcon} />
        </div>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <RoomSlugMarker ownerName={ownerName} roomPrompt={roomPrompt} />
    </>
  );
}
