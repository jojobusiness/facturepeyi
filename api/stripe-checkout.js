import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICE_IDS = [
  "price_1TYQZWIck4iMBRE9Ulc07a9u", // Solo
  "price_1TYQbBIck4iMBRE9PeSRBS3R", // Pro
  "price_1TYQcIIck4iMBRE9PMoZ4wZW", // Expert
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
