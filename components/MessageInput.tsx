"use client";

import { useState, type KeyboardEvent } from "react";
import styles from "./MessageInput.module.css";

interface MessageInputProps {
  onSubmit: (text: string) => void;
}

export default function MessageInput({ onSubmit }: MessageInputProps) {
  const [value, setValue] = useState("");

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <input
      className={styles.input}
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type something..."
      autoComplete="off"
      spellCheck={false}
    />
  );
}
