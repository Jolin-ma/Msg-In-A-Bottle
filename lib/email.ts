import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "Msg In A Bottle <hello@msg-in-a-bottle.com>";
const APP_URL = process.env.APP_URL || "https://msg-in-a-bottle.com";

// Mirrors app/globals.css and the site's own panels (WelcomePanel,
// not-found.tsx): cream ground, centered serif text, no cards or buttons.
// Email clients strip web fonts, so this leans on the same Georgia fallback
// the site's Cormorant Garamond stack already declares.
const BG = "#f7f4ec";
const FG = "#111111";
const MUTED = "#999999";
const FAINT = "#cccccc";
const FONT = "Georgia, 'Times New Roman', serif";

interface EmailLink {
  label: string;
  href: string;
}

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

  const html = renderEmail({
    heading: "Someone left you a message.",
    bodyHtml: `<p style="${paragraph}">It's waiting in <strong style="color: ${FG};">${escapeHtml(label)}</strong>.</p>`,
    link: { label: "open it", href: link },
  });

  const text = `Someone replied to ${label}.\n\nOpen it: ${link}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Someone left you a message",
      html,
      text,
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

  const dashboardLink = `${APP_URL}/dashboard`;
  const diaryLink = `${APP_URL}/diary`;
  const greeting = name ? `Welcome, ${escapeHtml(name)}.` : "Welcome.";

  const html = renderEmail({
    heading: greeting,
    bodyHtml: `
      <p style="${paragraph}">Thanks for creating an account.</p>
      <p style="${paragraph}">Create a bottle, share its link, and whatever comes back
      lands in your dashboard. Want somewhere just for you instead? Keep a
      <a href="${diaryLink}" style="${anchor}">diary</a> — a private bottle only you can read.</p>
    `,
    link: { label: "go to your dashboard", href: dashboardLink },
  });

  const text = `${name ? `Welcome, ${name}.` : "Welcome."}

Thanks for creating an account.

Create a bottle, share its link, and whatever comes back lands in your dashboard. Want somewhere just for you instead? Keep a diary — a private bottle only you can read: ${diaryLink}

Go to your dashboard: ${dashboardLink}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Msg In A Bottle",
      html,
      text,
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

const paragraph = `margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${MUTED};`;
const anchor = `color: ${MUTED}; border-bottom: 1px solid ${FAINT};`;

// Table-based layout (not flex/grid) so this renders consistently in
// Outlook and other email clients that only support a subset of CSS.
function renderEmail({
  heading,
  bodyHtml,
  link,
}: {
  heading: string;
  bodyHtml: string;
  link: EmailLink;
}): string {
  return `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: ${BG}; font-family: ${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BG};">
      <tr>
        <td align="center" style="padding: 72px 24px;">
          <table role="presentation" width="380" cellpadding="0" cellspacing="0" style="max-width: 380px; width: 100%;">
            <tr>
              <td style="text-align: center; padding-bottom: 16px;">
                <img src="${APP_URL}/bottle.png" width="40" alt="" style="width: 40px; height: auto; opacity: 0.85;" />
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 400; color: ${FG}; font-family: ${FONT};">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 8px; text-align: center;">
                <a href="${link.href}" style="font-size: 15px; color: ${MUTED}; border-bottom: 1px solid ${FAINT}; padding-bottom: 2px; text-decoration: none; font-family: ${FONT};">${link.label}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
