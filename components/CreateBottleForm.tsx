"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreateBottleForm.module.css";

export default function CreateBottleForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = slug.trim();
    if (!trimmed) return;

    setPending(true);
    try {
      const response = await fetch("/api/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: trimmed,
          name: prompt.trim(),
          isPublic,
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

      setSlug("");
      setPrompt("");
      setPending(false);
      router.push(`/welcome?bottle=${encodeURIComponent(trimmed)}&public=${isPublic}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="name-your-bottle"
        autoComplete="off"
        spellCheck={false}
      />
      <input
        className={`${styles.input} ${styles.promptInput}`}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="something that made us happy today"
        autoComplete="off"
      />
      <div className={styles.visibility} role="radiogroup" aria-label="Bottle visibility">
        <button
          type="button"
          role="radio"
          aria-checked={isPublic}
          className={`${styles.visibilityOption} ${isPublic ? styles.visibilityActive : ""}`}
          onClick={() => setIsPublic(true)}
        >
          public — cast into the sea
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isPublic}
          className={`${styles.visibilityOption} ${!isPublic ? styles.visibilityActive : ""}`}
          onClick={() => setIsPublic(false)}
        >
          private — just between us
        </button>
      </div>
      <button type="submit" className={styles.submit} disabled={pending}>
        + New bottle
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
