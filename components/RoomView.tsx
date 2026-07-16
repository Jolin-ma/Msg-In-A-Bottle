"use client";

import { useEffect, useRef } from "react";
import PhysicsCanvas, { type PhysicsCanvasHandle } from "./PhysicsCanvas";
import MessageInput from "./MessageInput";
import RandomLink from "./RandomLink";
import RoomSlugMarker from "./RoomSlugMarker";

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
}

const MAX_REPLAY_WINDOW_MS = 8000;
const MAX_STAGGER_MS = 120;
const MIN_STAGGER_MS = 15;

export default function RoomView({
  slug,
  initialMessages,
  ownerName = null,
  roomPrompt = null,
}: RoomViewProps) {
  const canvasRef = useRef<PhysicsCanvasHandle>(null);

  useEffect(() => {
    const count = initialMessages.length;
    if (count === 0) return;

    const stagger = Math.max(
      MIN_STAGGER_MS,
      Math.min(MAX_STAGGER_MS, MAX_REPLAY_WINDOW_MS / count),
    );

    const timeouts = initialMessages.map((message, index) =>
      setTimeout(() => {
        canvasRef.current?.spawnText(message.text);
      }, index * stagger),
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(text: string) {
    canvasRef.current?.spawnText(text);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomSlug: slug, text }),
      });
      if (!response.ok) {
        console.warn("Failed to persist message:", await response.text());
      }
    } catch (error) {
      console.warn("Failed to persist message:", error);
    }
  }

  return (
    <>
      <PhysicsCanvas ref={canvasRef} />
      <MessageInput onSubmit={handleSubmit} />
      <RandomLink />
      <RoomSlugMarker slug={slug} ownerName={ownerName} roomPrompt={roomPrompt} />
    </>
  );
}
