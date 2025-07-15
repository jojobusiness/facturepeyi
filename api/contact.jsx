import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Méthode non autorisée");

  const { nom, prenom, email, message } = req.body;

  // Création du transporteur (SMTP Vercel ou Gmail par exemple)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "johnfres.45@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD, // à stocker dans les ENV de Vercel
    },
  });

  const mailOptions = {
    from: email,
    to: "johnfres.45@gmail.com",
    subject: `📩 Nouveau message depuis FacturPeyi`,
    text: `Nom : ${prenom} ${nom}\nEmail : ${email}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Message envoyé." });
  } catch (error) {
    console.error("Erreur envoi mail:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
