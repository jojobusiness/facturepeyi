import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { session_id } = req.query;

  if (!session_id) return res.status(400).json({ error: "session_id requis" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(402).json({ error: "Paiement non confirmé" });
    }

    return res.status(200).json({
      planId: session.metadata?.planId || "solo",
      stripeCustomerId: session.customer,
      stripeSubscriptionId: typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id,
    });
  } catch (err) {
    console.error("get-session-info error:", err);
    return res.status(500).json({ error: "Erreur récupération session" });
  }
}
