import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logSysadmin } from "../lib-server/sysadmin-log.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, state, error } = req.query;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.facturepeyi.com").trim().replace(/\/$/, "");

  if (error || !code || !state) {
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }

  const cookieNonce = req.headers.cookie?.match(/oauth_nonce=([^;]+)/)?.[1];
  const dotIdx = state.indexOf(".");
  const stateNonce = dotIdx > 0 ? state.substring(0, dotIdx) : "";
  const entrepriseId = dotIdx > 0 ? state.substring(dotIdx + 1) : "";

  if (!cookieNonce || cookieNonce !== stateNonce || !entrepriseId) {
    logSysadmin(db, {
      severity: "error",
      source: "stripe-connect-callback",
      message: "Nonce CSRF invalide ou state malformé",
      meta: { hasCookie: !!cookieNonce, hasState: !!state, entrepriseId },
    }).catch(() => {});
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }

  // Vérif d'existence : l'entrepriseId du state doit pointer sur un doc réel.
  // L'auth admin est garantie par /api/stripe-connect-oauth qui n'émet le state
  // qu'après vérification du Bearer token + rôle admin (anti-IDOR).
  const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
  if (!entrepriseSnap.exists) {
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

    await db.collection("entreprises").doc(entrepriseId).update({
      stripeConnectedAccountId: tokenData.stripe_user_id,
    });

    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=connected`);
  } catch (err) {
    console.error("Stripe Connect callback error:", err);
    logSysadmin(db, {
      severity: "error",
      source: "stripe-connect-callback",
      message: err.message,
      meta: { entrepriseId },
    }).catch(() => {});
    return res.redirect(302, `${siteUrl}/dashboard/parametres?stripe=error`);
  }
}
