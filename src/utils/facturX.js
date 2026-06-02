// Génère le XML CII (Cross-Industry Invoice) au format Factur-X profil BASIC,
// conforme à la norme EN 16931 — la donnée structurée exigée par la réforme
// facture électronique 2026-2027.
//
// Profil : urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic
// Le BASIC inclut les lignes + la ventilation de TVA (ce qu'un expert-comptable
// et une PDP attendent), tout en restant générable à partir du modèle mono-ligne
// de Factur'Peyi.
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
  if (rate > 0) return { code: "S", rate, reason: null };
  if (mentionLegale && mentionLegale.trim()) return { code: "E", rate: 0, reason: mentionLegale.trim() };
  return { code: "Z", rate: 0, reason: null };
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
 * Construit le XML Factur-X BASIC à partir du contexte facture enrichi
 * (mêmes champs que ceux passés à InvoicePDF : entrepriseNom, entrepriseSiret,
 * entrepriseAdresse, clientNom, clientAdresse, amountHT, tva, totalTTC, tvaRate, mentionLegale).
 *
 * @returns {string} XML CII bien formé
 */
export function buildFacturXXML(invoice) {
  const num = invoiceNumber(invoice);
  const issue = fmtDate102(invoice.date);
  const ht = amt(invoice.amountHT);
  const tva = amt(invoice.tva);
  const ttc = amt(invoice.totalTTC ?? Number(invoice.amountHT || 0) + Number(invoice.tva || 0));
  const cat = vatCategory(invoice.tvaRate, invoice.mentionLegale);
  const rateStr = (Number(cat.rate) || 0).toFixed(2);
  const currency = invoice.currency || "EUR";

  const sellerName = invoice.entrepriseNom || "Entreprise";
  const sellerAddr = invoice.entrepriseAdresse || "";
  const sellerCountry = invoice.entrepriseCountryId || "FR";
  const legal = sellerLegalId(invoice.entrepriseSiret);
  const sellerVat = invoice.entrepriseTva || invoice.entrepriseNumeroTVA || "";

  const buyerName = invoice.clientNom || "Client";
  const buyerAddr = invoice.clientAdresse || "";
  const buyerCountry = invoice.clientCountryId || "FR";

  const desc = invoice.description || "Prestation";

  // Bloc exonération réutilisé en ligne et en en-tête
  const exemptionLine = cat.reason
    ? `\n            <ram:ExemptionReason>${esc(cat.reason)}</ram:ExemptionReason>`
    : "";

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

  const sellerAddrLine = sellerAddr
    ? `\n            <ram:LineOne>${esc(sellerAddr)}</ram:LineOne>`
    : "";
  const buyerAddrLine = buyerAddr
    ? `\n            <ram:LineOne>${esc(buyerAddr)}</ram:LineOne>`
    : "";

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
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(desc)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${ht}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1.00</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${cat.code}</ram:CategoryCode>
          <ram:RateApplicablePercent>${rateStr}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${ht}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(sellerName)}</ram:Name>${sellerLegalBlock}
        <ram:PostalTradeAddress>${sellerAddrLine}
          <ram:CountryID>${esc(sellerCountry)}</ram:CountryID>
        </ram:PostalTradeAddress>${sellerVatBlock}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(buyerName)}</ram:Name>
        <ram:PostalTradeAddress>${buyerAddrLine}
          <ram:CountryID>${esc(buyerCountry)}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${esc(currency)}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${tva}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${ht}</ram:BasisAmount>
        <ram:CategoryCode>${cat.code}</ram:CategoryCode>${exemptionLine}
        <ram:RateApplicablePercent>${rateStr}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${ht}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${ht}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${esc(currency)}">${tva}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${ttc}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${ttc}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

export { PROFILE_ID };
