import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token requis" });

  const linkDoc = await db.collection("paymentLinks").doc(token).get();
  if (!linkDoc.exists) return res.status(404).json({ error: "Lien invalide" });

  const { entrepriseId, factureId } = linkDoc.data();

  const [factureSnap, entrepriseSnap] = await Promise.all([
    db.collection("entreprises").doc(entrepriseId).collection("factures").doc(factureId).get(),
    db.collection("entreprises").doc(entrepriseId).get(),
  ]);

  if (!factureSnap.exists) return res.status(404).json({ error: "Facture introuvable" });

  const facture = factureSnap.data();
  if (facture.status === "payée") return res.status(400).json({ error: "already_paid" });

  const entreprise = entrepriseSnap.data() || {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: facture.numero
              ? `Facture ${facture.numero} — ${entreprise.nom || ""}`
              : `Facture — ${entreprise.nom || ""}`,
            description: facture.description || undefined,
          },
          unit_amount: Math.round(facture.totalTTC * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "invoice_payment",
      token,
      entrepriseId,
      factureId,
    },
    success_url: `${siteUrl}/portail/${token}?paid=true`,
    cancel_url: `${siteUrl}/portail/${token}`,
  });

  return res.status(200).json({ url: session.url });
}
