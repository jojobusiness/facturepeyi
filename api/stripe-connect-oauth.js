import { randomBytes } from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAdminOfEntreprise } from "../lib-server/auth.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { entrepriseId } = req.body || {};
  const check = await verifyAdminOfEntreprise(db, req, entrepriseId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const clientId = (process.env.STRIPE_CONNECT_CLIENT_ID || "").trim();
  if (!clientId) return res.status(500).json({ error: "STRIPE_CONNECT_CLIENT_ID non configuré" });

  const nonce = randomBytes(16).toString("hex");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.facturepeyi.com").trim().replace(/\/$/, "");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    state: `${nonce}.${entrepriseId}`,
    redirect_uri: `${siteUrl}/api/stripe-connect-callback`,
  });
  const redirectUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

  res.setHeader(
    "Set-Cookie",
    `oauth_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/api/stripe-connect-callback`
  );

  return res.status(200).json({ url: redirectUrl });
}
