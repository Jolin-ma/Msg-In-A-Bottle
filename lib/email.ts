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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
