import styles from "./BottleMessage.module.css";

interface BottleMessageProps {
  messages: { id: string; text: string }[];
}

export default function BottleMessage({ messages }: BottleMessageProps) {
  return (
    <div className={styles.stack}>
      {messages.map((message) => (
        <p key={message.id} className={styles.message}>
          {message.text}
        </p>
      ))}
    </div>
  );
}
