const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.get("/api/verify-payment", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.json({ paymentOk: false });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      res.json({ paymentOk: true });
    } else {
      res.json({ paymentOk: false });
    }
  } catch (err) {
    res.json({ paymentOk: false });
  }
});