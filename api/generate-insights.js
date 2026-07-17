import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { verifyBearer } from "../lib-server/auth.js";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const PLANS_AUTORISES = ["pro", "expert", "cabinet"];
const MAX_REFRESH_PAR_MOIS = 4;

const INSIGHTS_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre: { type: "string", description: "Titre court et percutant (max 8 mots)" },
          constat: { type: "string", description: "Le constat CHIFFRÉ tiré des données fournies (1-2 phrases)" },
          action: { type: "string", description: "L'action concrète recommandée, actionnable dans Factur'Peyi ou dans la gestion (1-2 phrases)" },
          impact: { type: "string", description: "Impact estimé en euros ou en risque évité, si calculable (sinon phrase courte)" },
          priorite: { type: "string", enum: ["haute", "moyenne", "basse"] },
        },
        required: ["titre", "constat", "action", "impact", "priorite"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
};

// Agrège les 6 derniers mois de données de l'entreprise en un résumé compact
async function buildAggregates(entrepriseId, entreprise) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = Timestamp.fromDate(sixMonthsAgo);
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const [facSnap, depSnap, catSnap] = await Promise.all([
    db.collection("entreprises").doc(entrepriseId).collection("factures").get(),
    db.collection("entreprises").doc(entrepriseId).collection("depenses").where("date", ">=", cutoff).get(),
    db.collection("entreprises").doc(entrepriseId).collection("categories").get(),
  ]);

  const catNames = {};
  catSnap.docs.forEach((d) => { catNames[d.id] = d.data().nom || "Sans catégorie"; });

  const caParMois = {};
  const impayesParClient = {};
  const retardsParClient = {};
  let caAnnee = 0;
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  facSnap.docs.forEach((doc) => {
    const f = doc.data();
    const date = f.date?.toDate?.();
    const ttc = Number(f.totalTTC) || 0;
    if (!date) return;
    if (f.status === "payée" && date >= yearStart) caAnnee += ttc;
    if (date >= sixMonthsAgo && f.status !== "annulée") {
      const k = monthKey(date);
      caParMois[k] = parseFloat(((caParMois[k] || 0) + ttc).toFixed(2));
    }
    const nom = f.clientNom || "Client inconnu";
    if (f.status === "en attente" || f.status === "en retard") {
      impayesParClient[nom] = parseFloat(((impayesParClient[nom] || 0) + ttc).toFixed(2));
    }
    if (f.status === "en retard") {
      retardsParClient[nom] = (retardsParClient[nom] || 0) + 1;
    }
  });

  const depParMois = {};
  const depParCategorie = {};
  depSnap.docs.forEach((doc) => {
    const d = doc.data();
    const date = d.date?.toDate?.();
    const ht = Number(d.montantHT) || 0;
    if (!date) return;
    const k = monthKey(date);
    depParMois[k] = parseFloat(((depParMois[k] || 0) + ht).toFixed(2));
    const cat = catNames[d.categorieId] || "Sans catégorie";
    depParCategorie[cat] = parseFloat(((depParCategorie[cat] || 0) + ht).toFixed(2));
  });

  return {
    entreprise: {
      territoire: entreprise.territoire || "inconnu",
      regime: entreprise.regime || "inconnu",
      tvaRate: entreprise.tvaRate ?? 0,
      octroiDeMer: !!entreprise.octroiDeMer,
    },
    ca_encaisse_annee_courante: parseFloat(caAnnee.toFixed(2)),
    ca_par_mois_6m: caParMois,
    depenses_ht_par_mois_6m: depParMois,
    depenses_ht_par_categorie_6m: depParCategorie,
    impayes_par_client: impayesParClient,
    nb_factures_en_retard_par_client: retardsParClient,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Conseiller IA non configuré." });

  const decoded = await verifyBearer(req);
  if (!decoded) return res.status(401).json({ error: "Non authentifié" });

  try {
    const userSnap = await db.collection("utilisateurs").doc(decoded.uid).get();
    const entrepriseId = userSnap.data()?.entrepriseId;
    if (!entrepriseId) return res.status(403).json({ error: "Entreprise introuvable." });

    const entSnap = await db.collection("entreprises").doc(entrepriseId).get();
    const entreprise = entSnap.data() || {};
    if (!PLANS_AUTORISES.includes(entreprise.plan)) {
      return res.status(403).json({ error: "Le Conseiller IA est disponible à partir du plan Pro.", upgradeRequired: true });
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const insightRef = db.collection("entreprises").doc(entrepriseId).collection("insights").doc(monthKey);
    const cached = await insightRef.get();
    const refresh = !!req.body?.refresh;

    // Cache mensuel : on ne régénère que sur demande explicite, dans la limite du quota
    if (cached.exists && !refresh) {
      const c = cached.data();
      return res.status(200).json({
        suggestions: c.suggestions,
        generatedAt: c.generatedAt?.toDate?.()?.toISOString() || null,
        refreshRestants: Math.max(MAX_REFRESH_PAR_MOIS - (c.refreshCount || 0), 0),
      });
    }
    const refreshCount = cached.exists ? (cached.data().refreshCount || 0) : 0;
    if (cached.exists && refresh && refreshCount >= MAX_REFRESH_PAR_MOIS) {
      return res.status(429).json({ error: "Limite d'actualisations atteinte ce mois-ci." });
    }

    const aggregates = await buildAggregates(entrepriseId, entreprise);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      output_config: { format: { type: "json_schema", schema: INSIGHTS_SCHEMA } },
      messages: [{
        role: "user",
        content: `Tu es le conseiller de gestion d'un entrepreneur des DOM-TOM utilisant le logiciel Factur'Peyi.
Voici ses données réelles (montants en euros) :

${JSON.stringify(aggregates, null, 1)}

Génère 3 à 5 suggestions de gestion CONCRÈTES et PERSONNALISÉES. Règles strictes :
- Chaque constat DOIT citer des chiffres présents dans les données (montants, tendances entre mois, noms de clients). INTERDIT d'inventer un chiffre absent des données.
- Actions actionnables : relances/acomptes pour les retardataires (Factur'Peyi gère les acomptes et rappels automatiques), provision de TVA collectée avant échéance (taux applicable : ${aggregates.entreprise.tvaRate}%), maîtrise des catégories de dépenses en hausse, suivi des seuils de régime.
- Seuils micro-entreprise 2026 à surveiller si le régime est micro : 77 700 € (services/BNC), 188 700 € (ventes/BIC). Si le régime est "auto-entrepreneur" ou "micro", compare le CA annuel encaissé au seuil pertinent et projette la fin d'année.
- Contexte territorial : territoire ${aggregates.entreprise.territoire}, TVA ${aggregates.entreprise.tvaRate}%${aggregates.entreprise.octroiDeMer ? ", soumis à l'octroi de mer sur les importations" : ""}.
- Si les données sont trop maigres pour une suggestion fiable, produis moins de suggestions plutôt que du générique. JAMAIS de conseil vague type "réduisez vos dépenses".
- Ton : direct, bienveillant, vouvoiement, français.`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (response.stop_reason === "refusal" || !textBlock) {
      return res.status(500).json({ error: "Génération impossible, réessayez." });
    }
    const suggestions = (JSON.parse(textBlock.text).suggestions || []).slice(0, 5);

    await insightRef.set({
      suggestions,
      generatedAt: Timestamp.now(),
      refreshCount: cached.exists ? refreshCount + 1 : 0,
    });

    return res.status(200).json({
      suggestions,
      generatedAt: new Date().toISOString(),
      refreshRestants: Math.max(MAX_REFRESH_PAR_MOIS - (cached.exists ? refreshCount + 1 : 0), 0),
    });
  } catch (err) {
    console.error("generate-insights:", err?.status, err?.message);
    return res.status(500).json({ error: "Erreur lors de la génération des suggestions." });
  }
}
