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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bottle.png" alt="" className={styles.bottleIcon} />
      Sign out
    </button>
  );
}
