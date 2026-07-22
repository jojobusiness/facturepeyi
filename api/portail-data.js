import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { devisNumero, devisExpiration } from "../lib-server/devis.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

function iso(ts) {
  if (!ts) return null;
  const d = ts?.toDate?.() ?? new Date(ts);
  return isNaN(d) ? null : d.toISOString();
}

async function loadClient(entrepriseId, clientId) {
  if (!clientId) return {};
  const snap = await db
    .collection("entreprises").doc(entrepriseId)
    .collection("clients").doc(clientId)
    .get();
  return snap.exists ? snap.data() : {};
}

function publicEntreprise(entreprise) {
  return {
    nom: entreprise.nom || "",
    adresse: entreprise.adresse || "",
    siret: entreprise.siret || "",
    logo: entreprise.logo || "",
    hasStripeConnect: !!entreprise.stripeConnectedAccountId,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "token requis" });

  const linkDoc = await db.collection("paymentLinks").doc(token).get();
  if (!linkDoc.exists) return res.status(404).json({ error: "Lien invalide ou expiré" });

  // `kind` absent = lien de facture émis avant l'ajout des liens de devis.
  const { entrepriseId, factureId, devisId, kind = "facture" } = linkDoc.data();

  const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
  const entreprise = entrepriseSnap.data() || {};

  // ── Devis ────────────────────────────────────────────────────────────────
  if (kind === "devis") {
    const devisSnap = await db
      .collection("entreprises").doc(entrepriseId)
      .collection("devis").doc(devisId)
      .get();
    if (!devisSnap.exists) return res.status(404).json({ error: "Devis introuvable" });

    const devis = devisSnap.data();
    const client = await loadClient(entrepriseId, devis.clientId);

    const expiration = devisExpiration(devis);
    const expired = !!expiration && expiration.getTime() < Date.now();

    return res.status(200).json({
      kind: "devis",
      devis: {
        id: devisId,
        numero: devisNumero(devis, devisId),
        lignes: devis.lignes || [],
        description: devis.description || "",
        amountHT: devis.amountHT ?? 0,
        tva: devis.tva ?? 0,
        totalTTC: devis.totalTTC ?? 0,
        tvaRate: devis.tvaRate ?? 0,
        mentionLegale: devis.mentionLegale || "",
        status: devis.status || "brouillon",
        convertedToFacture: !!devis.convertedToFacture,
        date: iso(devis.date),
        dateExpiration: iso(devis.dateExpiration || devis.dateValidite),
        acceptedAt: iso(devis.acceptedAt),
        acceptedBy: devis.acceptedBy || "",
        refusedAt: iso(devis.refusedAt),
        expired,
      },
      entreprise: publicEntreprise(entreprise),
      client: {
        nom: client.nom || devis.clientNom || "",
        email: client.email || devis.clientEmail || "",
        adresse: client.adresse || "",
        telephone: client.telephone || "",
      },
    });
  }

  // ── Facture ──────────────────────────────────────────────────────────────
  const factureSnap = await db
    .collection("entreprises").doc(entrepriseId)
    .collection("factures").doc(factureId)
    .get();

  if (!factureSnap.exists) return res.status(404).json({ error: "Facture introuvable" });

  const facture = factureSnap.data();
  const client = await loadClient(entrepriseId, facture.clientId);

  return res.status(200).json({
    kind: "facture",
    facture: {
      ...facture,
      id: factureId,
      date: iso(facture.date),
      createdAt: iso(facture.createdAt),
    },
    entreprise: publicEntreprise(entreprise),
    client: {
      nom: client.nom || facture.clientNom || "",
      email: client.email || facture.clientEmail || "",
      adresse: client.adresse || "",
      telephone: client.telephone || "",
    },
  });
}
