import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const auth = getAuth();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }

  const { entrepriseId } = req.body;
  if (!entrepriseId) return res.status(400).json({ error: "entrepriseId requis" });

  const membreSnap = await db
    .collection("entreprises").doc(entrepriseId)
    .collection("membres").doc(decoded.uid)
    .get();

  if (!membreSnap.exists || membreSnap.data()?.role !== "admin") {
    return res.status(403).json({ error: "Accès refusé — rôle admin requis" });
  }

  const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
  if (!entrepriseSnap.exists) return res.status(404).json({ error: "Entreprise introuvable" });

  const connectedAccountId = entrepriseSnap.data()?.stripeConnectedAccountId;

  if (connectedAccountId) {
    if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
      return res.status(500).json({
        error: "STRIPE_CONNECT_CLIENT_ID non configuré côté serveur — déconnexion annulée pour éviter une désynchronisation Stripe/Firestore."
      });
    }
    try {
      const r = await fetch("https://connect.stripe.com/oauth/deauthorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${(process.env.STRIPE_SECRET_KEY || "").trim()}`,
        },
        body: new URLSearchParams({
          client_id: process.env.STRIPE_CONNECT_CLIENT_ID.trim(),
          stripe_user_id: connectedAccountId,
        }),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        // 401 "stripe_user_id" déjà déauthorisé côté Stripe = OK, on continue.
        if (r.status !== 401) {
          console.error("Stripe deauthorize error:", r.status, body);
          return res.status(502).json({ error: `Stripe deauthorize failed (${r.status})` });
        }
      }
    } catch (err) {
      console.error("Stripe deauthorize network error:", err);
      return res.status(502).json({ error: "Erreur réseau Stripe deauthorize" });
    }
  }

  await db.collection("entreprises").doc(entrepriseId).update({
    stripeConnectedAccountId: null,
  });

  return res.status(200).json({ success: true });
}
