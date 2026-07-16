import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoomsByOwner } from "@/lib/rooms";
import CreateBottleForm from "@/components/CreateBottleForm";
import SignOutButton from "@/components/SignOutButton";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const bottles = await getRoomsByOwner(session.user.id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.email}>{session.user.email}</span>
        <SignOutButton />
      </div>

      <CreateBottleForm />

      <div className={styles.bottles}>
        {bottles.length === 0 && (
          <p className={styles.empty}>No bottles yet. Create one above.</p>
        )}
        {bottles.map((bottle) => (
          <section key={bottle.id} className={styles.bottle}>
            <a className={styles.bottleLink} href={`/${bottle.slug}`}>
              /{bottle.slug}
            </a>
            <span className={styles.count}>
              {bottle.messages.length} message
              {bottle.messages.length === 1 ? "" : "s"} collected
            </span>
            {bottle.messages.length > 0 && (
              <ul className={styles.messages}>
                {bottle.messages.map((message) => (
                  <li key={message.id} className={styles.message}>
                    {message.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
