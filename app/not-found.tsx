import Link from "next/link";
import styles from "./not-found.module.css";

// Rendered for any slug that doesn't match a bottle (see app/[slug]/page.tsx)
// — including diary bottles opened by someone other than their owner, which
// 404 on purpose so they're indistinguishable from links that never existed.
export default function NotFound() {
  return (
    <div className={styles.panel}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bottle.png" alt="" className={styles.bottle} />
      <p className={styles.heading}>This bottle drifted away&hellip;</p>
      <p className={styles.body}>
        There&rsquo;s nothing at this address. The link may be mistyped, or its
        bottle has been let go.
      </p>
      <Link href="/" className={styles.shore}>
        back to shore
      </Link>
    </div>
  );
}
