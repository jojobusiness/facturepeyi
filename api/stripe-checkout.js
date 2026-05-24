import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { verifyBearer } from "../lib-server/auth.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || "").trim());

const ALLOWED_PRICE_IDS = [
  "price_1TYQZWIck4iMBRE9Ulc07a9u", // Solo
  "price_1TYQbBIck4iMBRE9PeSRBS3R", // Pro
  "price_1TYQcIIck4iMBRE9PMoZ4wZW", // Expert
];

const ALLOWED_ORIGINS = [
  "https://www.facturepeyi.com",
  "https://facturepeyi.com",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Anti-abus : restreindre aux requêtes venant de notre frontend (CORS-like check).
  // Le checkout doit rester accessible aux visiteurs non connectés (flux d'inscription),
  // donc on protège par Origin plutôt que par auth obligatoire.
  const origin = req.headers.origin || req.headers.referer || "";
  const fromAllowedOrigin =
    process.env.NODE_ENV !== "production" ||
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  if (!fromAllowedOrigin) {
    return res.status(403).json({ error: "Origine non autorisée" });
  }

  const { priceId, planId } = req.body || {};
  if (!priceId) return res.status(400).json({ error: "priceId requis" });
  if (!ALLOWED_PRICE_IDS.includes(priceId)) return res.status(400).json({ error: "Plan invalide" });

  // Auth optionnelle : si un utilisateur est connecté, on attache son email et son uid
  // pour que le webhook puisse lier le stripeCustomerId à son entreprise.
  let customerEmail = null;
  let clientReferenceId = undefined;
  const decoded = await verifyBearer(req);
  if (decoded) {
    customerEmail = decoded.email || null;
    if (!customerEmail) {
      const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
      customerEmail = userSnap.data()?.email || null;
    }
    clientReferenceId = decoded.uid;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.facturepeyi.com").trim().replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      client_reference_id: clientReferenceId,
      metadata: { planId: planId || "solo", uid: decoded?.uid || "" },
      success_url: `${siteUrl}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/paiement/cancel`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
}
