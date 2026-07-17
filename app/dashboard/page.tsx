import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoomsByOwner } from "@/lib/rooms";
import ContactInfo from "@/components/ContactInfo";
import CreateBottleForm from "@/components/CreateBottleForm";
import RemoveBottleButton from "@/components/RemoveBottleButton";
import SignOutButton from "@/components/SignOutButton";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const BOTTLE_IMAGES = ["/bottle1.png", "/bottle2.png", "/bottle3.png"];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const bottles = await getRoomsByOwner(session.user.id);

  return (
    <div className={styles.page}>
      <SignOutButton />
      <div className={styles.header}>
        <span className={styles.email}>{session.user.email}</span>
      </div>

      <CreateBottleForm />

      <div className={styles.bottles}>
        {bottles.length === 0 && (
          <p className={styles.empty}>No bottles yet. Create one above.</p>
        )}
        {bottles.map((bottle, index) => {
          const latest = bottle.messages[0];
          const unread =
            Boolean(latest) &&
            (!bottle.lastReadAt || latest.createdAt > bottle.lastReadAt);
          const count = bottle._count.messages;

          return (
            <div key={bottle.id} className={styles.bottle}>
              <a className={styles.bottleLink} href={`/${bottle.slug}`}>
                <span className={styles.iconWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={BOTTLE_IMAGES[index % BOTTLE_IMAGES.length]}
                    alt=""
                    className={styles.icon}
                  />
                  {unread && <span className={styles.unreadDot} aria-label="unread" />}
                </span>

                <span className={styles.info}>
                  <span className={styles.slug}>
                    {bottle.name || bottle.slug}
                  </span>
                  <span className={styles.meta}>
                    {bottle.isPublic ? "public" : "private"}
                    {" · "}
                    {count === 0
                      ? "empty — waiting for a message"
                      : `${count} message${count === 1 ? "" : "s"} collected`}
                    {unread && " · new"}
                  </span>
                </span>
              </a>
              <RemoveBottleButton slug={bottle.slug} hasMessages={count > 0} />
            </div>
          );
        })}
      </div>

      <ContactInfo />
    </div>
  );
}
