import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import { registerPdfFonts } from "../utils/pdfFonts";
import { normalizeLines, computeTotals } from "../utils/invoiceLines";

registerPdfFonts();

const BRAND_GREEN = "#0f5c3c";
const GRAY = "#555";
const LIGHT_GRAY = "#f5f5f5";
const BORDER = "#e0e0e0";

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Inter",
    padding: 40,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  logo: { width: 90, height: 50, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 13, fontWeight: 700, color: BRAND_GREEN },
  companyDetail: { fontSize: 9, color: GRAY, marginTop: 2 },
  infoBlock: { backgroundColor: LIGHT_GRAY, borderRadius: 4, padding: 12, textAlign: "right" },
  invoiceTitle: { fontSize: 18, fontWeight: 700, color: BRAND_GREEN, marginBottom: 4 },
  invoiceRef: { fontSize: 9, color: GRAY, marginBottom: 8 },
  clientLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", marginBottom: 3 },
  clientName: { fontSize: 11, fontWeight: 700 },
  clientDetail: { fontSize: 9, color: GRAY, marginTop: 2 },
  // Tableau
  tableHeader: { flexDirection: "row", backgroundColor: BRAND_GREEN, padding: "8 12", borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { color: "#fff", fontSize: 9, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: "8 12", borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" },
  tableRowAlt: { backgroundColor: LIGHT_GRAY },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colVat: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },
  cellText: { fontSize: 9, color: "#333" },
  // Totaux
  totalsBox: { marginTop: 16, alignSelf: "flex-end", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 9, color: "#333" },
  totalTTCRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: BRAND_GREEN, borderRadius: 4, padding: "8 12", marginTop: 4 },
  totalTTCLabel: { fontSize: 10, fontWeight: 700, color: "#fff" },
  totalTTCValue: { fontSize: 10, fontWeight: 700, color: "#fff" },
  statusBadge: { marginTop: 16, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, fontSize: 9, fontWeight: 700 },
  mentionLegale: { marginTop: 16, fontSize: 8, color: "#2563eb", backgroundColor: "#eff6ff", borderRadius: 4, padding: "6 10" },
  // Paiement
  paymentBox: { marginTop: 16, fontSize: 8, color: GRAY, backgroundColor: LIGHT_GRAY, borderRadius: 4, padding: "8 10" },
  paymentTitle: { fontSize: 8, fontWeight: 700, color: "#333", marginBottom: 2 },
  // Footer
  separator: { height: 1, backgroundColor: BORDER, marginTop: 24, marginBottom: 8 },
  footer: { fontSize: 7.5, color: GRAY, textAlign: "center" },
});

function statusColor(status) {
  switch (status) {
    case "payée":     return { backgroundColor: "#dcfce7", color: "#166534" };
    case "en retard": return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:          return { backgroundColor: "#fef9c3", color: "#854d0e" };
  }
}

const fmt = (n) => `${(Number(n) || 0).toFixed(2)} €`;

export default function InvoicePDF({ invoice }) {
  const date = invoice.date?.toDate?.().toLocaleDateString?.("fr-FR")
    ?? (invoice.date ? new Date(invoice.date).toLocaleDateString("fr-FR") : "");
  const mentionLegale = invoice.mentionLegale ?? "";
  const ref = invoice.numero || (invoice.id ? `FAC-${invoice.id.slice(0, 8).toUpperCase()}` : "FAC-XXXXXX");
  const badge = statusColor(invoice.status);

  const lines = normalizeLines(invoice);
  const { totalHT, totalTTC, taxByRate } = computeTotals(lines);
  const vatRows = Array.from(taxByRate.entries());

  // Bloc mentions légales (footer)
  const legalBits = [];
  if (invoice.entrepriseFormeJuridique) legalBits.push(invoice.entrepriseFormeJuridique);
  if (invoice.entrepriseCapital) legalBits.push(`capital ${invoice.entrepriseCapital} €`);
  if (invoice.entrepriseSiret && invoice.entrepriseSiret !== "SIRET inconnu") legalBits.push(`SIRET ${invoice.entrepriseSiret}`);
  if (invoice.entrepriseTva) legalBits.push(`TVA ${invoice.entrepriseTva}`);
  if (invoice.entrepriseRcs) legalBits.push(invoice.entrepriseRcs);

  const hasIban = !!invoice.entrepriseIban;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {invoice.logoDataUrl
              ? <Image src={invoice.logoDataUrl} style={styles.logo} />
              : null}
            <Text style={styles.companyName}>{invoice.entrepriseNom || "Factur'Peyi"}</Text>
            {invoice.entrepriseAdresse && <Text style={styles.companyDetail}>{invoice.entrepriseAdresse}</Text>}
            {(invoice.entrepriseCodePostal || invoice.entrepriseVille) && (
              <Text style={styles.companyDetail}>{[invoice.entrepriseCodePostal, invoice.entrepriseVille].filter(Boolean).join(" ")}</Text>
            )}
            {invoice.entrepriseTel && <Text style={styles.companyDetail}>Tél : {invoice.entrepriseTel}</Text>}
            {invoice.entrepriseEmail && <Text style={styles.companyDetail}>{invoice.entrepriseEmail}</Text>}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceRef}>Réf. {ref}</Text>
            <Text style={styles.invoiceRef}>Date : {date}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.clientLabel}>Facturé à</Text>
              <Text style={styles.clientName}>{invoice.clientNom}</Text>
              {invoice.clientAdresse && <Text style={styles.clientDetail}>{invoice.clientAdresse}</Text>}
              {(invoice.clientCodePostal || invoice.clientVille) && (
                <Text style={styles.clientDetail}>{[invoice.clientCodePostal, invoice.clientVille].filter(Boolean).join(" ")}</Text>
              )}
              {invoice.clientEmail && <Text style={styles.clientDetail}>{invoice.clientEmail}</Text>}
            </View>
          </View>
        </View>

        {/* Tableau des lignes */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>P.U. HT</Text>
          <Text style={[styles.tableHeaderText, styles.colVat]}>TVA</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
        </View>
        {lines.map((l, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : null]}>
            <Text style={[styles.cellText, styles.colDesc]}>{l.description}</Text>
            <Text style={[styles.cellText, styles.colQty]}>{l.quantite}</Text>
            <Text style={[styles.cellText, styles.colUnit]}>{fmt(l.prixUnitaire)}</Text>
            <Text style={[styles.cellText, styles.colVat]}>{l.tvaRate}%</Text>
            <Text style={[styles.cellText, styles.colTotal]}>{fmt(l.ht)}</Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmt(totalHT)}</Text>
          </View>
          {vatRows.map(([rate, amount]) => (
            <View key={rate} style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({rate}%)</Text>
              <Text style={styles.totalValue}>{fmt(amount)}</Text>
            </View>
          ))}
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLabel}>Total TTC</Text>
            <Text style={styles.totalTTCValue}>{fmt(totalTTC)}</Text>
          </View>
        </View>

        {/* Statut */}
        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: badge.color }}>
            Statut : {invoice.status ?? "en attente"}
          </Text>
        </View>

        {/* Mention légale fiscale */}
        {mentionLegale ? <Text style={styles.mentionLegale}>{mentionLegale}</Text> : null}

        {/* Coordonnées bancaires (si renseignées) */}
        {hasIban && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Coordonnées bancaires</Text>
            <Text>IBAN : {invoice.entrepriseIban}{invoice.entrepriseBic ? `   ·   BIC : ${invoice.entrepriseBic}` : ""}</Text>
          </View>
        )}

        {/* Footer mentions légales */}
        <View style={styles.separator} />
        {legalBits.length > 0 && (
          <Text style={styles.footer}>{legalBits.join(" · ")}</Text>
        )}
        <Text style={styles.footer}>
          Merci pour votre confiance — {invoice.entrepriseNom || "Factur'Peyi"} © {new Date().getFullYear()}
        </Text>

      </Page>
    </Document>
  );
}
