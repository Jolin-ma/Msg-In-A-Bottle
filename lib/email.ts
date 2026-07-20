import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "Msg In A Bottle <hello@msg-in-a-bottle.com>";
const APP_URL = process.env.APP_URL || "https://msg-in-a-bottle.com";

// Best-effort: a notification email failing (missing key, Resend outage,
// bad address) must never take down the request that triggered it.
export async function sendNewMessageEmail(
  to: string,
  roomSlug: string,
  roomName: string | null,
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping new-message email");
    return;
  }

  const link = `${APP_URL}/${roomSlug}`;
  const label = roomName || "your bottle";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Someone left you a message",
      html: `<p>Someone replied to <strong>${escapeHtml(label)}</strong>.</p><p><a href="${link}">Open it</a></p>`,
      text: `Someone replied to ${label}.\n\nOpen it: ${link}`,
    });
    if (error) {
      console.error("Failed to send new-message email", error);
    } else {
      console.log("Sent new-message email", data);
    }
  } catch (error) {
    console.error("Failed to send new-message email", error);
  }
}

// Best-effort: same as above — a failed welcome email must never block
// account creation or sign-in.
export async function sendWelcomeEmail(to: string, name: string | null) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const greeting = name ? `Welcome, ${escapeHtml(name)}.` : "Welcome.";
  const dashboardLink = `${APP_URL}/dashboard`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Msg In A Bottle",
      html: `
        <p>${greeting}</p>
        <p>Thanks for creating an account with Msg In A Bottle.</p>
        <p>Here's how it works: you create a bottle, share its private link with someone,
        and whatever they write back lands in your dashboard. Think of it as a message
        that only the person you send it to can find.</p>
        <ul>
          <li>Head to your <a href="${dashboardLink}">dashboard</a> to create your first bottle.</li>
          <li>Copy its link and send it to whoever you want to hear from.</li>
          <li>We'll email you the moment they write back.</li>
          <li>Want somewhere just for you? Keep a <a href="${APP_URL}/diary">diary</a> —
          a private bottle only you can read.</li>
        </ul>
        <p>Glad you're here.</p>
      `,
      text: `${name ? `Welcome, ${name}.` : "Welcome."}

Thanks for creating an account with Msg In A Bottle.

Here's how it works: you create a bottle, share its private link with someone, and whatever they write back lands in your dashboard. Think of it as a message that only the person you send it to can find.

- Head to your dashboard to create your first bottle: ${dashboardLink}
- Copy its link and send it to whoever you want to hear from.
- We'll email you the moment they write back.
- Want somewhere just for you? Keep a diary — a private bottle only you can read: ${APP_URL}/diary

Glad you're here.`,
    });
    if (error) {
      console.error("Failed to send welcome email", error);
    } else {
      console.log("Sent welcome email", data);
    }
  } catch (error) {
    console.error("Failed to send welcome email", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
