import styles from "./BottleMessage.module.css";

interface BottleMessageProps {
  text: string;
}

export default function BottleMessage({ text }: BottleMessageProps) {
  return <p className={styles.message}>{text}</p>;
}
