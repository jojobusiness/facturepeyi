import { auth } from "./firebase";

export async function sendEmail(type, to, data = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers,
    body: JSON.stringify({ type, to, data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Email failed");
  }
  return res.json();
}
