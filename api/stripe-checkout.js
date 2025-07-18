import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { priceId } = req.body;

  if (!priceId) return res.status(400).json({ error: "Price ID requis" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // Stripe Price ID
          quantity: 1,
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement/cancel`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe Checkout:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
}