// Sole operator of this app — gates the Operations Dashboard. Hardcoded
// rather than an env var since there's exactly one admin and it isn't
// expected to change; update here if that ever stops being true.
export const ADMIN_EMAIL = "jolinma81@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.toLowerCase() === ADMIN_EMAIL;
}
