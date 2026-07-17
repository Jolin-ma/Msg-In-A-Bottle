import styles from "./BottleMessage.module.css";

interface BottleMessageProps {
  messages: { id: string; text: string; createdAt: string }[];
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
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
