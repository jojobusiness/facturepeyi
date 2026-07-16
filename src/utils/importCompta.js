// Parsing tolérant pour les exports Excel/CSV français (séparateur ;, virgule
// décimale, dates JJ/MM/AAAA) — utilisé par ImportDepenses et ImportFactures.

// "1 234,56 €" → 1234.56 ; "12,50" → 12.5 ; "1234.56" → 1234.56
export function parseMontantFR(raw) {
  if (raw === null || raw === undefined) return 0;
  let s = String(raw).trim().replace(/\s|€|eur/gi, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.abs(n);
}

// JJ/MM/AAAA, JJ-MM-AA, AAAA-MM-JJ… → Date (ou null si illisible)
export function parseDateFR(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    const d = new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Normalise une clé de colonne : minuscules, sans accents ni espaces/underscores
function normKey(k) {
  return String(k || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[\s_-]/g, "");
}

// Retourne la valeur de la première colonne du row correspondant à un alias
export function pickField(row, aliases) {
  const wanted = aliases.map(normKey);
  for (const key of Object.keys(row)) {
    if (wanted.includes(normKey(key))) {
      const v = row[key];
      if (v !== null && v !== undefined && String(v).trim() !== "") return String(v).trim();
    }
  }
  return "";
}

// Règles d'auto-catégorisation des dépenses par mots-clés (libellés AG courants)
export const CATEGORY_RULES = [
  { nom: "Carburant",               couleur: "#f59e0b", motsCles: ["carburant", "essence", "gasoil", "gazole", "station", "total energies", "rubis"] },
  { nom: "Loyer & Local",           couleur: "#6366f1", motsCles: ["loyer", "bail", "local commercial", "charges locatives"] },
  { nom: "Énergie & Eau",           couleur: "#eab308", motsCles: ["edf", "electricite", "energie", "sgde", "eau"] },
  { nom: "Télécom & Internet",      couleur: "#3b82f6", motsCles: ["orange", "sfr", "free", "digicel", "internet", "telephone", "mobile", "box"] },
  { nom: "Fournitures",             couleur: "#10b981", motsCles: ["fourniture", "papeterie", "bureau vallee", "materiel", "consommable"] },
  { nom: "Repas & Déplacements",    couleur: "#ef4444", motsCles: ["restaurant", "repas", "hotel", "billet", "avion", "air france", "air caraibes", "peage", "taxi", "parking"] },
  { nom: "Assurances",              couleur: "#8b5cf6", motsCles: ["assurance", "mutuelle", "axa", "generali", "allianz", "gan"] },
  { nom: "Banque & Frais",          couleur: "#64748b", motsCles: ["frais bancaire", "commission", "agios", "cotisation carte", "bred", "bnp"] },
  { nom: "Logiciels & Abonnements", couleur: "#0ea5e9", motsCles: ["abonnement", "logiciel", "google", "microsoft", "adobe", "canva", "hebergement", "ovh", "domaine"] },
  { nom: "Sous-traitance",          couleur: "#f97316", motsCles: ["sous-trait", "freelance", "prestataire", "prestation ext"] },
];

// Détecte la catégorie d'une dépense depuis son libellé (fournisseur + description)
export function detectCategorie(texte) {
  const t = String(texte || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const rule of CATEGORY_RULES) {
    if (rule.motsCles.some((k) => t.includes(k))) return rule;
  }
  return null;
}

// Normalise un statut de devis importé → brouillon / envoyé / accepté / refusé
export function normalizeStatutDevis(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .trim();
  if (!s) return "envoyé";
  if (s.includes("brouillon") || s.includes("draft")) return "brouillon";
  if (s.includes("accept") || s.includes("valid") || s.includes("signe") || s.includes("gagne")) return "accepté";
  if (s.includes("refus") || s.includes("perdu") || s.includes("rejet")) return "refusé";
  if (s.includes("envoy") || s.includes("cours") || s.includes("attente")) return "envoyé";
  return "envoyé";
}

// Normalise un statut de facture importée → statuts internes de l'app
export function normalizeStatut(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .trim();
  if (!s) return "payée";
  if (s.includes("attente") || s.includes("impaye") || s.includes("due")) return "en attente";
  if (s.includes("retard")) return "en retard";
  if (s.includes("annul")) return "annulée";
  if (s.includes("pay") || s.includes("regle") || s.includes("solde")) return "payée";
  return "payée";
}
