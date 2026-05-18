import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, state, error } = req.query;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com").trim().replace(/\/$/, "");

  if (error || !code || !state) {
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }

  // Validation CSRF — le nonce dans le cookie doit correspondre au state Stripe
  const cookieNonce = req.headers.cookie?.match(/oauth_nonce=([^;]+)/)?.[1];
  const dotIdx = state.indexOf(".");
  const stateNonce = state.substring(0, dotIdx);
  const entrepriseId = state.substring(dotIdx + 1);

  if (!cookieNonce || cookieNonce !== stateNonce || !entrepriseId) {
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }

  try {
    const tokenRes = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: (process.env.STRIPE_SECRET_KEY || "").trim(),
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
