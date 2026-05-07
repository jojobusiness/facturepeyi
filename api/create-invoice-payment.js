import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_RATE = 0.025; // 2,5%

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
  const connectedAccountId = entreprise.stripeConnectedAccountId;

  if (!connectedAccountId) return res.status(400).json({ error: "no_stripe_connect" });

  const totalCents = Math.round(facture.totalTTC * 100);
  const feeCents = Math.round(totalCents * PLATFORM_FEE_RATE);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturepeyi.com";

  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

  const baseSessionParams = {
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
          unit_amount: totalCents,
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
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      ...baseSessionParams,
      payment_intent_data: {
        application_fee_amount: feeCents,
        on_behalf_of: connectedAccountId,
        transfer_data: { destination: connectedAccountId },
      },
    });
  } catch (err) {
    // En mode test, si le compte Connect est invalide, on crée la session sans Connect
    // pour permettre de tester le flow complet. En production ce fallback n'existe pas.
    if (isTestMode && err?.code === "resource_missing") {
      console.warn("Test mode: compte Connect invalide, fallback sans Connect");
      try {
        session = await stripe.checkout.sessions.create(baseSessionParams);
      } catch (fallbackErr) {
        console.error("Stripe checkout fallback error:", fallbackErr);
        return res.status(500).json({
          error: "stripe_error",
          message: fallbackErr?.message || "Erreur Stripe inconnue",
        });
      }
    } else {
      console.error("Stripe checkout error:", err);
      return res.status(500).json({
        error: "stripe_error",
        message: err?.message || "Erreur Stripe inconnue",
      });
    }
  }

  return res.status(200).json({ url: session.url });
}
