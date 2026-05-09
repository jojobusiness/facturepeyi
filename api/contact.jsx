export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Méthode non autorisée");

  const { nom, prenom, email, message } = req.body;

  if (!nom || !prenom || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email invalide" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Factur'Peyi Contact <noreply@neleiintuc.resend.app>",
        to: ["contact@facturepeyi.com"],
        reply_to: email,
        subject: `Nouveau message depuis FacturPeyi — ${prenom} ${nom}`,
        html: `
          <p><strong>Nom :</strong> ${prenom} ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Message :</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Resend error:", err);
      return res.status(500).json({ error: "Erreur envoi email" });
    }

    return res.status(200).json({ message: "Message envoyé." });
  } catch (error) {
    console.error("Erreur envoi contact:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
