function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Méthode non autorisée");

  const { nom, prenom, email, message } = req.body || {};

  if (!nom || !prenom || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email invalide" });
  }

  if (String(message).length > 5000) {
    return res.status(400).json({ error: "Message trop long (5000 caractères max)" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  try {
    const safeMessage = esc(message).replace(/\n/g, "<br>");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        from: "Factur'Peyi Contact <noreply@neleiintuc.resend.app>",
        to: ["contact@facturepeyi.com"],
        reply_to: email,
        subject: `Nouveau message depuis Factur'Peyi — ${esc(prenom)} ${esc(nom)}`,
        html: `
          <p><strong>Nom :</strong> ${esc(prenom)} ${esc(nom)}</p>
          <p><strong>Email :</strong> ${esc(email)}</p>
          <p><strong>Message :</strong></p>
          <p>${safeMessage}</p>
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
