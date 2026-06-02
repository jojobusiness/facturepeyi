// Helpers partagés pour les factures/devis multi-lignes.
// Repli sur le modèle mono-ligne historique (description + amountHT) si `lignes` absent,
// pour que les anciens documents continuent de s'afficher et de se calculer correctement.

/** @returns {{description, quantite, prixUnitaire, tvaRate, ht}[]} */
export function normalizeLines(doc) {
  const defaultRate = Number(doc?.tvaRate) || 0;
  if (Array.isArray(doc?.lignes) && doc.lignes.length) {
    return doc.lignes.map((l) => {
      const quantite = Number(l.quantite ?? 1) || 0;
      const prixUnitaire = Number(l.prixUnitaire ?? 0) || 0;
      const tvaRate = l.tvaRate != null ? Number(l.tvaRate) || 0 : defaultRate;
      return {
        description: l.description || "",
        quantite,
        prixUnitaire,
        tvaRate,
        ht: +(quantite * prixUnitaire).toFixed(2),
      };
    });
  }
  const ht = Number(doc?.amountHT ?? 0) || 0;
  return [{
    description: doc?.description || "",
    quantite: 1,
    prixUnitaire: ht,
    tvaRate: defaultRate,
    ht,
  }];
}

/**
 * Totaux à partir des lignes : HT, TVA (ventilée par taux), TTC.
 * @returns {{ totalHT:number, totalTVA:number, totalTTC:number, taxByRate:Map<number,number> }}
 */
export function computeTotals(lines) {
  let totalHT = 0;
  const taxByRate = new Map();
  for (const l of lines) {
    totalHT += l.ht;
    const r = Number(l.tvaRate) || 0;
    const cur = taxByRate.get(r) || 0;
    taxByRate.set(r, +(cur + l.ht * r / 100).toFixed(2));
  }
  totalHT = +totalHT.toFixed(2);
  let totalTVA = 0;
  taxByRate.forEach((v) => { totalTVA += v; });
  totalTVA = +totalTVA.toFixed(2);
  return { totalHT, totalTVA, totalTTC: +(totalHT + totalTVA).toFixed(2), taxByRate };
}

/** Une ligne vide pour l'éditeur. */
export function emptyLine(tvaRate = 0) {
  return { description: "", quantite: 1, prixUnitaire: "", tvaRate };
}
