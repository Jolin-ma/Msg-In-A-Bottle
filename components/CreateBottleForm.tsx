"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BOTTLE_ICONS } from "@/lib/bottleIcons";
import styles from "./CreateBottleForm.module.css";

export default function CreateBottleForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [isDiary, setIsDiary] = useState(false);
  const [pickingIcon, setPickingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pickingIcon) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPickingIcon(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickingIcon]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!slug.trim()) {
      setError("Name your bottle first.");
      return;
    }
    setError(null);
    setPickingIcon(true);
  }

  async function handlePickIcon(iconIndex: number) {
    setPickingIcon(false);
    setPending(true);
    try {
      const response = await fetch("/api/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          message: message.trim(),
          isDiary,
          iconIndex,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error === "slug_taken"
            ? "That name is already taken."
            : "Couldn't create that bottle.",
        );
        setPending(false);
        return;
      }

      const room = await response.json();

      setSlug("");
      setMessage("");
      setIsDiary(false);
      setPending(false);
      router.push(`/welcome?bottle=${encodeURIComponent(room.slug)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="name-your-bottle"
          autoComplete="off"
          spellCheck={false}
        />
        <textarea
          className={styles.message}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message..."
          rows={2}
          maxLength={500}
        />
        <div className={styles.framing} role="radiogroup" aria-label="Bottle framing">
          <button
            type="button"
            role="radio"
            aria-checked={!isDiary}
            className={`${styles.framingOption} ${!isDiary ? styles.framingActive : ""}`}
            onClick={() => setIsDiary(false)}
          >
            A private harbor — a letter for someone
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isDiary}
            className={`${styles.framingOption} ${isDiary ? styles.framingActive : ""}`}
            onClick={() => setIsDiary(true)}
          >
            Diary — a secret cast to the sea
          </button>
        </div>
        <button type="submit" className={styles.submit} disabled={pending}>
          + New bottle
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {pickingIcon && (
        <div className={styles.backdrop} onClick={() => setPickingIcon(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a bottle style"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setPickingIcon(false)}
              aria-label="Close"
            >
              ×
            </button>
            <p className={styles.modalHeading}>Choose a bottle style</p>
            <div className={styles.icons} role="radiogroup" aria-label="Bottle icon">
              {BOTTLE_ICONS.map((icon, index) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  aria-label={`Bottle style ${index + 1}`}
                  className={styles.iconOption}
                  onClick={() => handlePickIcon(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" className={styles.iconImg} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
