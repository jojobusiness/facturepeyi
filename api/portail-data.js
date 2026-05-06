import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token requis" });

  const linkDoc = await db.collection("paymentLinks").doc(token).get();
  if (!linkDoc.exists) return res.status(404).json({ error: "Lien invalide ou expiré" });

  const { entrepriseId, factureId } = linkDoc.data();

  const [factureSnap, entrepriseSnap] = await Promise.all([
    db.collection("entreprises").doc(entrepriseId).collection("factures").doc(factureId).get(),
    db.collection("entreprises").doc(entrepriseId).get(),
  ]);

  if (!factureSnap.exists) return res.status(404).json({ error: "Facture introuvable" });

  const facture = factureSnap.data();
  const entreprise = entrepriseSnap.data() || {};

  let client = {};
  if (facture.clientId) {
    const clientSnap = await db
      .collection("entreprises").doc(entrepriseId)
      .collection("clients").doc(facture.clientId)
      .get();
    if (clientSnap.exists) client = clientSnap.data();
  }

  return res.status(200).json({
    facture: {
      ...facture,
      id: factureId,
      date: facture.date?.toDate?.()?.toISOString() ?? null,
      createdAt: facture.createdAt?.toDate?.()?.toISOString() ?? null,
    },
    entreprise: {
      nom: entreprise.nom || "",
      adresse: entreprise.adresse || "",
      siret: entreprise.siret || "",
      logo: entreprise.logo || "",
    },
    client: {
      nom: client.nom || facture.clientNom || "",
      email: client.email || facture.clientEmail || "",
      adresse: client.adresse || "",
      telephone: client.telephone || "",
    },
  });
}
