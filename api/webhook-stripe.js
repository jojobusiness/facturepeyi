import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel — ne pas parser le body (besoin du buffer brut pour la signature Stripe)
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function findEntrepriseByCustomerId(customerId) {
  const snap = await db.collection("entreprises")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = webhookSecret
      ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
      : JSON.parse(rawBody.toString());
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const doc = await findEntrepriseByCustomerId(sub.customer);
        if (!doc) break;

        const status = sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : sub.status;

        await doc.ref.update({ planStatus: status, stripeSubscriptionId: sub.id });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const doc = await findEntrepriseByCustomerId(sub.customer);
        if (!doc) break;
        // Repasser au plan gratuit
        await doc.ref.update({ plan: "decouverte", planStatus: "canceled", stripeSubscriptionId: null });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const doc = await findEntrepriseByCustomerId(invoice.customer);
        if (doc) await doc.ref.update({ planStatus: "past_due" });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle") {
          const doc = await findEntrepriseByCustomerId(invoice.customer);
          if (doc) await doc.ref.update({ planStatus: "active" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return res.status(200).json({ received: true });
}
