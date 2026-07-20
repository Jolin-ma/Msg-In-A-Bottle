import styles from "./BottleMessage.module.css";

interface BottleMessageProps {
  messages: { id: string; text: string; createdAt: string }[];
}

// Pinned locale (not the runtime's default) so server and client render the
// same string — a locale-dependent format here caused a hydration mismatch
// whenever the server's locale differed from the browser's.
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BottleMessage({ messages }: BottleMessageProps) {
  return (
    <div className={styles.stack}>
      {messages.map((message) => (
        <div key={message.id} className={styles.entry}>
          <p className={styles.message}>{message.text}</p>
          <span className={styles.timestamp}>{formatTimestamp(message.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
