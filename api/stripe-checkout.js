import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICE_IDS = [
  "price_1Rlat8Ick4iMBRE91vyvhOFc", // Solo
  "price_1RlatdIck4iMBRE9fWyZausA", // Pro
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { priceId, planId } = req.body;

  if (!priceId) return res.status(400).json({ error: "priceId requis" });

  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return res.status(400).json({ error: "Plan invalide" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { planId: planId || "solo" },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement/cancel`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
}
