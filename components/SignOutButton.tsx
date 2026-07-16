"use client";

import { signOut } from "next-auth/react";
import styles from "./SignOutButton.module.css";

export default function SignOutButton() {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </button>
  );
}
