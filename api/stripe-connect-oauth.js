import { randomBytes } from "crypto";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { entrepriseId } = req.query;
  if (!entrepriseId) return res.status(400).json({ error: "entrepriseId requis" });

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "STRIPE_CONNECT_CLIENT_ID non configuré" });

  const nonce = randomBytes(16).toString("hex");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com";

  // Cookie HttpOnly pour valider le retour Stripe (anti-CSRF)
  res.setHeader(
    "Set-Cookie",
    `oauth_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/api/stripe-connect-callback`
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    state: `${nonce}.${entrepriseId}`,
    redirect_uri: `${siteUrl}/api/stripe-connect-callback`,
  });

  return res.redirect(302, `https://connect.stripe.com/oauth/authorize?${params.toString()}`);
}
