// Génère le XML CII (Cross-Industry Invoice) au format Factur-X profil BASIC,
// conforme à la norme EN 16931 — la donnée structurée exigée par la réforme
// facture électronique 2026-2027.
//
// Profil : urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic
// Le BASIC inclut les lignes + la ventilation de TVA (ce qu'un expert-comptable
// et une PDP attendent). Supporte les factures multi-lignes (invoice.lignes[])
// avec repli sur le modèle mono-ligne historique.
//
// ⚠️ Ce module produit le XML. L'embarquement dans le PDF (PDF/A-3 + XMP) est géré
//    par embedFacturX() dans pdfFacturX.js. Le raccordement à une PDP agréée reste
//    un chantier partenariat séparé (voir mémoire project-reforme-einvoicing).

const PROFILE_ID = "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic";

/** Échappe les caractères réservés XML. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Montant à 2 décimales, séparateur point (exigé en XML). */
function amt(n) {
  return (Number(n) || 0).toFixed(2);
}

/** Date Firestore/JS → AAAAMMJJ (format 102 UNTDID). */
function fmtDate102(value) {
  let d;
  if (value && typeof value.toDate === "function") d = value.toDate();
  else if (value) d = new Date(value);
  else d = new Date();
  if (isNaN(d)) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${j}`;
}

/** Numéro de facture lisible — réutilise le `numero` stocké sinon dérive de l'id. */
function invoiceNumber(invoice) {
  if (invoice.numero) return invoice.numero;
  if (invoice.id) return `FAC-${invoice.id.slice(0, 8).toUpperCase()}`;
  return "FAC-XXXXXX";
}

/**
 * Catégorie de TVA EN 16931 (BT-118) + données associées.
 * - taux > 0  → "S" (taux normal/réduit)
 * - taux == 0 → "E" (exonéré) avec motif = mention légale (art. 294 DOM, 293 B franchise…)
 *               ou "Z" (taux zéro) si aucune mention.
 */
function vatCategory(tvaRate, mentionLegale) {
  const rate = Number(tvaRate) || 0;
  if (rate > 0) return { code: "S", reason: null };
  if (mentionLegale && mentionLegale.trim()) return { code: "E", reason: mentionLegale.trim() };
  return { code: "Z", reason: null };
}

/**
 * Identifiant légal du vendeur : SIRET (14 chiffres, schemeID 0009) ou
 * SIREN (9 chiffres, schemeID 0002). Renvoie null si non exploitable.
 */
function sellerLegalId(siret) {
  const digits = String(siret ?? "").replace(/\D/g, "");
  if (digits.length === 14) return { id: digits, scheme: "0009" };
  if (digits.length === 9) return { id: digits, scheme: "0002" };
  if (digits.length > 0) return { id: digits, scheme: "0002" };
  return null;
}

/**
 * Normalise les lignes de la facture. Repli sur le modèle mono-ligne historique
 * (description + amountHT) si invoice.lignes est absent.
 * @returns {{ description, quantite, prixUnitaire, tvaRate, ht }[]}
 */
function normalizeLines(invoice) {
  const defaultRate = Number(invoice.tvaRate) || 0;
  if (Array.isArray(invoice.lignes) && invoice.lignes.length) {
    return invoice.lignes.map((l) => {
      const quantite = Number(l.quantite ?? 1) || 0;
      const prixUnitaire = Number(l.prixUnitaire ?? 0) || 0;
      const tvaRate = l.tvaRate != null ? Number(l.tvaRate) || 0 : defaultRate;
      return {
        description: l.description || "Prestation",
        quantite,
        prixUnitaire,
        tvaRate,
        ht: +(quantite * prixUnitaire).toFixed(2),
      };
    });
  }
  const ht = Number(invoice.amountHT ?? 0) || 0;
  return [{
    description: invoice.description || "Prestation",
    quantite: 1,
    prixUnitaire: ht,
    tvaRate: defaultRate,
    ht,
  }];
}

/**
 * Construit le XML Factur-X BASIC à partir du contexte facture enrichi.
 * Champs attendus : entrepriseNom, entrepriseSiret, entrepriseAdresse,
 * entrepriseCodePostal, entrepriseVille, entrepriseTva, clientNom, clientAdresse,
 * et soit invoice.lignes[] soit (description, amountHT). tvaRate / mentionLegale
 * servent de valeurs par défaut au niveau ligne.
 * @returns {string} XML CII bien formé
 */
export function buildFacturXXML(invoice) {
  const num = invoiceNumber(invoice);
  const issue = fmtDate102(invoice.date);
  const currency = invoice.currency || "EUR";
  const mention = invoice.mentionLegale || "";

  const lines = normalizeLines(invoice);

  // Lignes XML + agrégation des taxes par (catégorie, taux)
  const taxGroups = new Map(); // clé "code|rate" → { code, rate, reason, basis }
  let lineTotal = 0;

  const lineXml = lines.map((l, i) => {
    const cat = vatCategory(l.tvaRate, mention);
    const rate = Number(l.tvaRate) || 0;
    lineTotal += l.ht;
    const key = `${cat.code}|${rate}`;
    const g = taxGroups.get(key) || { code: cat.code, rate, reason: cat.reason, basis: 0 };
    g.basis = +(g.basis + l.ht).toFixed(2);
    taxGroups.set(key, g);

    return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(l.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amt(l.prixUnitaire)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${amt(l.quantite)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat.code}</ram:CategoryCode>
          <ram:RateApplicablePercent>${rate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amt(l.ht)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join("\n");

  // Blocs ApplicableTradeTax (en-tête) par groupe + totaux
  let taxTotal = 0;
  const taxXml = Array.from(taxGroups.values()).map((g) => {
    const tva = +(g.basis * g.rate / 100).toFixed(2);
    taxTotal += tva;
    const exemption = g.reason
      ? `\n        <ram:ExemptionReason>${esc(g.reason)}</ram:ExemptionReason>`
      : "";
    return `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(tva)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${amt(g.basis)}</ram:BasisAmount>
        <ram:CategoryCode>${g.code}</ram:CategoryCode>${exemption}
        <ram:RateApplicablePercent>${g.rate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
  }).join("\n");

  lineTotal = +lineTotal.toFixed(2);
  taxTotal = +taxTotal.toFixed(2);
  const grandTotal = +(lineTotal + taxTotal).toFixed(2);

  // Vendeur
  const sellerName = invoice.entrepriseNom || "Entreprise";
  const sellerCountry = invoice.entrepriseCountryId || "FR";
  const legal = sellerLegalId(invoice.entrepriseSiret);
  const sellerVat = invoice.entrepriseTva || invoice.entrepriseNumeroTVA || "";

  const sellerLegalBlock = legal
    ? `
          <ram:SpecifiedLegalOrganization>
            <ram:ID schemeID="${legal.scheme}">${esc(legal.id)}</ram:ID>
          </ram:SpecifiedLegalOrganization>`
    : "";
  const sellerVatBlock = sellerVat
    ? `
          <ram:SpecifiedTaxRegistration>
            <ram:ID schemeID="VA">${esc(sellerVat)}</ram:ID>
          </ram:SpecifiedTaxRegistration>`
    : "";
  const sellerAddr = addressBlock({
    line: invoice.entrepriseAdresse,
    cp: invoice.entrepriseCodePostal,
    ville: invoice.entrepriseVille,
    country: sellerCountry,
  });

  // Acheteur
  const buyerName = invoice.clientNom || "Client";
  const buyerCountry = invoice.clientCountryId || "FR";
  const buyerAddr = addressBlock({
    line: invoice.clientAdresse,
    cp: invoice.clientCodePostal,
    ville: invoice.clientVille,
    country: buyerCountry,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${PROFILE_ID}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(num)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issue}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lineXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(sellerName)}</ram:Name>${sellerLegalBlock}
${sellerAddr}${sellerVatBlock}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(buyerName)}</ram:Name>
${buyerAddr}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${esc(currency)}</ram:InvoiceCurrencyCode>
${taxXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(lineTotal)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amt(lineTotal)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${esc(currency)}">${amt(taxTotal)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(grandTotal)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amt(grandTotal)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/** Construit un bloc PostalTradeAddress (indenté 8 espaces). */
function addressBlock({ line, cp, ville, country }) {
  const parts = ["        <ram:PostalTradeAddress>"];
  if (cp) parts.push(`          <ram:PostcodeCode>${esc(cp)}</ram:PostcodeCode>`);
  if (line) parts.push(`          <ram:LineOne>${esc(line)}</ram:LineOne>`);
  if (ville) parts.push(`          <ram:CityName>${esc(ville)}</ram:CityName>`);
  parts.push(`          <ram:CountryID>${esc(country)}</ram:CountryID>`);
  parts.push("        </ram:PostalTradeAddress>");
  return parts.join("\n");
}

export { PROFILE_ID };
