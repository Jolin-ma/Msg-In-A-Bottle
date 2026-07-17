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

  useEffect(() => {
    if (!released) return;
    const timeout = window.setTimeout(() => {
      router.push("/dashboard");
    }, DRIFT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [released, router]);

  async function handleSubmit(text: string) {
    canvasRef.current?.spawnText(text);
    setHasSubmittedOnce(true);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomSlug: slug, text }),
      });

      if (!response.ok) {
        setPending(false);
        setError("Couldn't send that. Try again.");
        return;
      }

      setPending(false);
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
      {released ? (
        <BottleReleased isPublic={isPublic} />
      ) : (
        <>
          {initialMessages.length > 0 && (
            <BottleMessage text={initialMessages[0].text} />
          )}
          <MessageInput
            onSubmit={handleSubmit}
            placeholder={placeholder}
            disabled={pending}
          />
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
      <RoomSlugMarker ownerName={ownerName} roomPrompt={roomPrompt} />
    </>
  );
}
