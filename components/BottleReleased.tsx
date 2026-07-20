import type { ReactNode } from "react";
import styles from "./BottleReleased.module.css";

interface BottleReleasedProps {
  children?: ReactNode;
}

export default function BottleReleased({ children }: BottleReleasedProps) {
  return (
    <div className={styles.panel}>
      <p className={styles.message}>Delivered.</p>
      {children}
    </div>
  );
}
