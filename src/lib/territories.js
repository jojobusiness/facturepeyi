// Configuration fiscale de tous les territoires DOM-TOM + métropole
// Source : CGI art. 294, 293B + réglementations locales

export const TERRITORIES = {
  martinique:        { label: "Martinique",               flag: "🇲🇶", tvaRate: 8.5,  octroiDeMer: true,  mentionLegale: "" },
  guadeloupe:        { label: "Guadeloupe",               flag: "🇬🇵", tvaRate: 8.5,  octroiDeMer: true,  mentionLegale: "" },
  guyane:            { label: "Guyane française",         flag: "🇬🇫", tvaRate: 0,    octroiDeMer: false, mentionLegale: "TVA non applicable - article 294 du CGI" },
  reunion:           { label: "La Réunion",               flag: "🇷🇪", tvaRate: 8.5,  octroiDeMer: true,  mentionLegale: "" },
  mayotte:           { label: "Mayotte",                  flag: "🇾🇹", tvaRate: 0,    octroiDeMer: false, mentionLegale: "TVA non applicable - article 294 du CGI" },
  saintmartin:       { label: "Saint-Martin",             flag: "🇸🇽", tvaRate: 8.5,  octroiDeMer: false, mentionLegale: "" },
  saintbarth:        { label: "Saint-Barthélemy",         flag: "🇧🇱", tvaRate: 0,    octroiDeMer: false, mentionLegale: "TVA non applicable - article 294 du CGI" },
  saintpierre:       { label: "Saint-Pierre-et-Miquelon", flag: "🇵🇲", tvaRate: 0,    octroiDeMer: false, mentionLegale: "TVA non applicable - article 294 du CGI" },
  nouvellecaledonie: { label: "Nouvelle-Calédonie",       flag: "🇳🇨", tvaRate: 11,   octroiDeMer: false, mentionLegale: "TGC (Taxe Générale sur la Consommation) - 11%" },
  polynesie:         { label: "Polynésie française",      flag: "🇵🇫", tvaRate: 16,   octroiDeMer: false, mentionLegale: "" },
  wallis:            { label: "Wallis-et-Futuna",         flag: "🇼🇫", tvaRate: 0,    octroiDeMer: false, mentionLegale: "TVA non applicable" },
  metropole:         { label: "France métropolitaine",    flag: "🇫🇷", tvaRate: 20,   octroiDeMer: false, mentionLegale: "" },
};

export const REGIMES = {
  "auto-entrepreneur": "Auto-entrepreneur",
  "micro-bic":         "Micro-BIC (commerçants, artisans)",
  "micro-bnc":         "Micro-BNC (professions libérales)",
  "reel":              "Régime réel (simplifié ou normal)",
};

/**
 * Calcule le taux de TVA effectif selon territoire + régime
 * L'auto-entrepreneur est toujours à 0% (art. 293B)
 */
export function getTvaRate(territoire, regime) {
  if (regime === "auto-entrepreneur") return 0;
  return TERRITORIES[territoire]?.tvaRate ?? 20;
}

/**
 * Calcule la mention légale à apposer sur les factures
 * L'auto-entrepreneur override toujours la mention territoriale
 */
export function getMentionLegale(territoire, regime) {
  if (regime === "auto-entrepreneur") return "TVA non applicable, art. 293 B du CGI";
  return TERRITORIES[territoire]?.mentionLegale || "";
}

/**
 * Retourne true si le territoire est soumis à l'Octroi de mer
 */
export function hasOctroiDeMer(territoire) {
  return TERRITORIES[territoire]?.octroiDeMer ?? false;
}
