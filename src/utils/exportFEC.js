// Génère un Fichier des Écritures Comptables (FEC) conforme à l'article A.47 A-1 du LPF.
// 18 colonnes obligatoires, séparateur tabulation, dates au format AAAAMMJJ, décimales à la virgule.
// Écritures en partie double avec TVA séparée (706/445710 en vente, 606/445660 en achat) —
// c'est ce qu'un expert-comptable attend pour intégrer le fichier dans son logiciel.

const FEC_HEADERS = [
  "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib",
  "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
  "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
];

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${j}`;
}

function fmtMontant(n) {
  return (Number(n) || 0).toFixed(2).replace(".", ",");
}

function clean(s) {
  // Aucun caractère de séparation (tab / saut de ligne) ne doit polluer un champ
  return String(s ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

/**
 * Construit les écritures comptables (partie double, TVA séparée) à partir des factures
 * et dépenses. `inPeriod(date)` filtre la période (mois ou exercice).
 */
export function buildEcritures(factures, depenses, inPeriod) {
  const ecritures = [];
  let num = 0;

  factures.forEach((f) => {
    const date = toDate(f.date);
    if (!date || !inPeriod(date)) return;
    const ht = Number(f.amountHT ?? 0);
    const tva = Number(f.tva ?? 0);
    const ttc = Number(f.totalTTC ?? ht + tva);
    num += 1;
    const lines = [
      { compteNum: "411000", compteLib: "Clients", debit: ttc, credit: 0 },
      { compteNum: "706000", compteLib: "Ventes / prestations de services", debit: 0, credit: ht },
    ];
    if (tva > 0) lines.push({ compteNum: "445710", compteLib: "TVA collectée", debit: 0, credit: tva });
    ecritures.push({
      journalCode: "VE", journalLib: "Ventes", num, date,
      ref: clean(f.numero || f.numeroFacture || f.id),
      lib: clean(`Facture ${f.clientNom || ""}`),
      lines,
    });
  });

  depenses.forEach((dp) => {
    const date = toDate(dp.date);
    if (!date || !inPeriod(date)) return;
    const ht = Number(dp.montantHT ?? 0);
    const tva = Number(dp.TVA ?? dp.tva ?? 0);
    const ttc = Number(dp.montantTTC ?? ht + tva);
    num += 1;
    const lines = [
      { compteNum: "606000", compteLib: "Achats", debit: ht, credit: 0 },
    ];
    if (tva > 0) lines.push({ compteNum: "445660", compteLib: "TVA déductible", debit: tva, credit: 0 });
    lines.push({ compteNum: "401000", compteLib: "Fournisseurs", debit: 0, credit: ttc });
    ecritures.push({
      journalCode: "AC", journalLib: "Achats", num, date,
      ref: clean(dp.reference || dp.id),
      lib: clean(`Achat ${dp.fournisseur || ""}`),
      lines,
    });
  });

  return ecritures;
}

/** Sérialise les écritures au format FEC (texte tabulé). */
export function ecrituresToFEC(ecritures) {
  const rows = [FEC_HEADERS.join("\t")];
  ecritures.forEach((e) => {
    const dateStr = fmtDate(e.date);
    e.lines.forEach((l) => {
      rows.push([
        e.journalCode, e.journalLib, e.num, dateStr,
        l.compteNum, l.compteLib, "", "",
        e.ref, dateStr, e.lib,
        fmtMontant(l.debit), fmtMontant(l.credit),
        "", "", dateStr, "", "",
      ].join("\t"));
    });
  });
  return rows.join("\r\n");
}
