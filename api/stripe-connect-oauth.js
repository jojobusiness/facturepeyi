export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { entrepriseId } = req.query;
  if (!entrepriseId) return res.status(400).json({ error: "entrepriseId requis" });

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "STRIPE_CONNECT_CLIENT_ID non configuré" });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    state: entrepriseId,
    redirect_uri: `${siteUrl}/api/stripe-connect-callback`,
  });

  return res.redirect(302, `https://connect.stripe.com/oauth/authorize?${params.toString()}`);
}
