import styles from "./BottleReleased.module.css";

export default function BottleReleased() {
  return (
    <div className={styles.panel}>
      <p className={styles.message}>Delivered.</p>
    </div>
  );
}
