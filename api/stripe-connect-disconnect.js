import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { entrepriseId } = req.body;
  if (!entrepriseId) return res.status(400).json({ error: "entrepriseId requis" });

  const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
  if (!entrepriseSnap.exists) return res.status(404).json({ error: "Entreprise introuvable" });

  const connectedAccountId = entrepriseSnap.data()?.stripeConnectedAccountId;

  if (connectedAccountId && process.env.STRIPE_CONNECT_CLIENT_ID) {
    try {
      await fetch("https://connect.stripe.com/oauth/deauthorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
        body: new URLSearchParams({
          client_id: process.env.STRIPE_CONNECT_CLIENT_ID,
          stripe_user_id: connectedAccountId,
        }),
      });
    } catch (err) {
      // Le compte peut déjà être révoqué côté Stripe, on continue quand même
      console.error("Stripe deauthorize error:", err);
    }
  }

  await db.collection("entreprises").doc(entrepriseId).update({
    stripeConnectedAccountId: null,
  });

  return res.status(200).json({ success: true });
}
