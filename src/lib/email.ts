import "server-only";
export const emailConfigured = () =>
  !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailConfigured())
    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM on the server.",
    );
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });
  if (!response.ok)
    throw new Error(
      "The email provider could not accept the message. Try again later.",
    );
}
