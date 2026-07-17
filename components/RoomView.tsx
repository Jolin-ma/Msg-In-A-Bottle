"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PhysicsCanvas, { type PhysicsCanvasHandle } from "./PhysicsCanvas";
import MessageInput from "./MessageInput";
import BottleMessage from "./BottleMessage";
import BottleReleased from "./BottleReleased";
import RoomSlugMarker from "./RoomSlugMarker";
import { DRIFT_DURATION_MS } from "@/lib/driftTiming";
import styles from "./RoomView.module.css";

export interface RoomMessage {
  id: string;
  text: string;
  createdAt: string;
}

interface RoomViewProps {
  slug: string;
  initialMessages: RoomMessage[];
  ownerName?: string | null;
  roomPrompt?: string | null;
  isPublic?: boolean;
}

export default function RoomView({
  slug,
  initialMessages,
  ownerName = null,
  roomPrompt = null,
  isPublic = true,
}: RoomViewProps) {
  const router = useRouter();
  const canvasRef = useRef<PhysicsCanvasHandle>(null);
  const [pending, setPending] = useState(false);
  const [released, setReleased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [wentPrivate, setWentPrivate] = useState(false);

  // initialMessages is newest-first; everything but the newest is already
  // "read" history, so it replays as a pre-fallen letter pile on open —
  // the newest one is shown as static readable text instead (below).
  const history = initialMessages.slice(1).reverse();

  useEffect(() => {
    const HISTORY_SPAWN_STAGGER_MS = 90;
    const timeouts = history.map((message, index) =>
      window.setTimeout(() => {
        canvasRef.current?.spawnText(message.text);
      }, index * HISTORY_SPAWN_STAGGER_MS),
    );
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!released) return;
    const timeout = window.setTimeout(() => {
      router.push("/dashboard");
    }, DRIFT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [released, router]);

  async function handleSubmit(text: string, makePrivate: boolean) {
    canvasRef.current?.spawnText(text);
    setHasSubmittedOnce(true);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomSlug: slug, text, makePrivate }),
      });

      if (!response.ok) {
        setPending(false);
        setError("Couldn't send that. Try again.");
        return;
      }

      setPending(false);
      if (makePrivate) setWentPrivate(true);
      setReleased(true);
    } catch {
      setPending(false);
      setError("Couldn't send that. Try again.");
    }
  }

  const placeholder = hasSubmittedOnce
    ? "Type something..."
    : initialMessages.length === 0
      ? "Be the first to leave a note..."
      : "Write your reply...";

  return (
    <>
      <PhysicsCanvas ref={canvasRef} />
      {released && <BottleReleased isPublic={isPublic && !wentPrivate} />}
      {!released && initialMessages.length > 0 && (
        <BottleMessage text={initialMessages[0].text} />
      )}
      {/* Stays mounted through the release so the bottle-icon drift
          animation (started on submit) can finish playing instead of
          getting unmounted mid-flight; its own controls hide once released. */}
      <MessageInput
        onSubmit={handleSubmit}
        placeholder={placeholder}
        disabled={pending || released}
        hideControls={released}
        isPublicBottle={isPublic}
      />
      {error && <p className={styles.error}>{error}</p>}
      <RoomSlugMarker ownerName={ownerName} roomPrompt={roomPrompt} />
    </>
  );
}
