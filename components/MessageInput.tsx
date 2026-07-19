"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { randomDriftStyle } from "@/lib/driftStyle";
import styles from "./MessageInput.module.css";

interface MessageInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hideControls?: boolean;
}

export default function MessageInput({
  onSubmit,
  placeholder = "Type something...",
  disabled = false,
  hideControls = false,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [floating, setFloating] = useState(false);
  const [driftStyle, setDriftStyle] = useState<CSSProperties>({});

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    setDriftStyle(randomDriftStyle());
    setFloating(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") submit();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        {!hideControls && (
          <input
            className={styles.input}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
          />
        )}
        <div className={styles.sendGroup}>
          {!hideControls && (
            <button
              type="button"
              className={styles.send}
              onClick={submit}
              disabled={disabled || !value.trim()}
            >
              press enter to send
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bottle.png"
            alt=""
            className={`${styles.bottleIcon} ${floating ? styles.floatAway : ""}`}
            style={floating ? driftStyle : undefined}
          />
        </div>
      </div>
    </div>
  );
}
