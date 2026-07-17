"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { DRIFT_DURATION_MS } from "@/lib/driftTiming";
import styles from "./MessageInput.module.css";

interface MessageInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomSigned(magnitude: number) {
  return (Math.random() < 0.5 ? -1 : 1) * magnitude;
}

function randomDriftStyle(): CSSProperties {
  return {
    "--drift-duration": `${DRIFT_DURATION_MS / 1000}s`,
    "--dx1": `${randomSigned(randomBetween(10, 25))}vw`,
    "--dy1": `${randomSigned(randomBetween(5, 15))}vh`,
    "--r1": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx2": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy2": `${-randomBetween(15, 30)}vh`,
    "--r2": `${randomSigned(randomBetween(6, 16))}deg`,
    "--dx3": `${randomSigned(randomBetween(10, 30))}vw`,
    "--dy3": `${-randomBetween(25, 45)}vh`,
    "--r3": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx4": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy4": `${-randomBetween(40, 60)}vh`,
    "--r4": `${randomSigned(randomBetween(6, 16))}deg`,
    "--dx5": `${randomSigned(randomBetween(10, 30))}vw`,
    "--dy5": `${-randomBetween(55, 75)}vh`,
    "--r5": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx6": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy6": `${-randomBetween(70, 90)}vh`,
  } as CSSProperties;
}

export default function MessageInput({
  onSubmit,
  placeholder = "Type something...",
  disabled = false,
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
    <div className={styles.row}>
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
      <div className={styles.sendGroup}>
        <button
          type="button"
          className={styles.send}
          onClick={submit}
          disabled={disabled || !value.trim()}
        >
          press enter to send
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bottle.png"
          alt=""
          className={`${styles.bottleIcon} ${floating ? styles.floatAway : ""}`}
          style={floating ? driftStyle : undefined}
        />
      </div>
    </div>
  );
}
