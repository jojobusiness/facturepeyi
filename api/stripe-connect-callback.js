import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, state: entrepriseId, error } = req.query;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com";

  if (error || !code || !entrepriseId) {
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }

  try {
    // Échange du code contre le stripe_user_id (compte connecté de l'entrepreneur)
    const tokenRes = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_SECRET_KEY,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    const connectedAccountId = tokenData.stripe_user_id;

    await db.collection("entreprises").doc(entrepriseId).update({
      stripeConnectedAccountId: connectedAccountId,
    });

    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=connected`);
  } catch (err) {
    console.error("Stripe Connect callback error:", err);
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }
}
