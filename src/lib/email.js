import { auth } from "./firebase";

export async function sendEmail(type, to, data = {}, { attachments, replyTo } = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = { type, to, data };
  if (attachments) body.attachments = attachments;
  if (replyTo) body.replyTo = replyTo;

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Email failed");
  }
  return res.json();
}
