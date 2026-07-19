"use client";

import { useEffect, useState } from "react";
import styles from "./PrivacyPolicy.module.css";

export default function PrivacyPolicy() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        [privacy]
      </button>

      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Privacy Policy"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.scroll}>
              <h2 className={styles.heading}>Privacy Policy</h2>
              <p className={styles.effective}>Effective Date: July 2026</p>

              <p>
                This Digital Diary is built to be a safe, quiet, and private
                space for your thoughts. Because your words break apart into a
                physical landscape unique to your account, protecting your
                privacy is our single most important responsibility.
              </p>
              <p>
                We do not sell, rent, or monetize your journal entries, text
                data, or personal details to anyone. Period.
              </p>

              <h3>1. What Data We Collect</h3>
              <p>
                To run this private sandbox diary, we only collect the bare
                minimum required to keep your account functioning:
              </p>
              <p>
                <strong>Account Credentials:</strong> Your email address and a
                securely encrypted password to authenticate your login.
              </p>
              <p>
                <strong>Diary Content:</strong> The text strings you type and
                submit, which generate the physical letters and letter
                sediment on your personalized canvas.
              </p>
              <p>
                <strong>Basic Technical Data:</strong> Essential technical
                logs (like your browser type or device resolution) used
                strictly to optimize the 2D physics engine performance for
                your screen size.
              </p>

              <h3>2. Absolute Privacy of Your Content</h3>
              <p>
                <strong>Zero Public Exposure:</strong> There are no public
                feeds, global oceans, or shared links. Every word you type is
                completely locked inside your password-protected account.
              </p>
              <p>
                <strong>Data in Transit and Rest:</strong> Your diary entries
                are transmitted securely using industry-standard SSL/TLS
                encryption and are stored safely in our database. Nobody else
                can view or access your letter sediment.
              </p>

              <h3>3. Data Storage &amp; The &quot;Right to Forget&quot;</h3>
              <p>
                You retain total ownership and control over your history.
              </p>
              <p>
                <strong>Permanent Deletion:</strong> If you decide to close
                your account or clear your history, we provide an immediate,
                permanent wipe option in your settings.
              </p>
              <p>
                <strong>The Clean Slate:</strong> Clicking &quot;Wipe My
                Data&quot; executes a permanent destructive command in our
                database, completely and irrevocably scrubbing your text
                sediment from our servers. We do not keep hidden backups of
                your deleted entries.
              </p>

              <h3>4. Third-Party Services</h3>
              <p>
                We do not use invasive third-party tracking cookies,
                background location tracking, or advertising networks. The
                only third-party systems used are infrastructure-related (our
                secure database hosting provider) strictly to keep the
                application online and running smoothly at 60 FPS.
              </p>

              <h3>5. Contact &amp; Questions</h3>
              <p>
                This project is built on trust. If you have any questions
                about how your physical text data is processed, stored, or
                secured, you can reach out directly via the feedback panel
                inside your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
