import CreateBottleForm from "@/components/CreateBottleForm";
import SignOutButton from "@/components/SignOutButton";
import styles from "@/app/dashboard/page.module.css";

const sampleBottles = [
  {
    id: "1",
    slug: "tidewater-echoes",
    messages: [{ id: "m1", text: "the light through the kitchen window this morning" }],
  },
  {
    id: "2",
    slug: "for-mara-only",
    messages: [],
  },
];

export default function PreviewDashboardPage() {
  return (
    <div className={styles.page}>
      <SignOutButton />
      <div className={styles.header}>
        <span className={styles.email}>you@example.com</span>
      </div>

      <CreateBottleForm />

      <div className={styles.bottles}>
        {sampleBottles.map((bottle) => (
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
