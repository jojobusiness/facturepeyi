import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

const BRAND_GREEN = "#0f5c3c";
const GRAY = "#555";
const LIGHT_GRAY = "#f5f5f5";
const BORDER = "#e0e0e0";

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    padding: 40,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  // ── En-tête ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  logo: {
    width: 90,
    height: 50,
    objectFit: "contain",
    marginBottom: 6,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
  },
  companyDetail: {
    fontSize: 9,
    color: GRAY,
    marginTop: 2,
  },
  // ── Bloc facture + client ──
  infoBlock: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 12,
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    marginBottom: 4,
  },
  invoiceRef: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 8,
  },
  clientLabel: {
    fontSize: 8,
    color: GRAY,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  clientDetail: {
    fontSize: 9,
    color: GRAY,
    marginTop: 2,
  },
  // ── Tableau ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_GREEN,
    padding: "8 12",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 12",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  colDesc: { flex: 3 },
  colQty:  { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colTotal:{ flex: 1, textAlign: "right" },
  cellText: { fontSize: 9, color: "#333" },
  // ── Totaux ──
  totalsBox: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 9, color: "#333" },
  totalTTCRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: BRAND_GREEN,
    borderRadius: 4,
    padding: "8 12",
    marginTop: 4,
  },
  totalTTCLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#fff" },
  totalTTCValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#fff" },
  // ── Statut ──
  statusBadge: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // ── Mention légale ──
  mentionLegale: {
    marginTop: 16,
    fontSize: 8,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    padding: "6 10",
  },
  // ── Footer ──
  separator: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 24,
    marginBottom: 8,
  },
  footer: {
    fontSize: 8,
    color: GRAY,
    textAlign: "center",
  },
});

function statusColor(status) {
  switch (status) {
    case "payée":    return { backgroundColor: "#dcfce7", color: "#166534" };
    case "en retard": return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:          return { backgroundColor: "#fef9c3", color: "#854d0e" };
  }
}

export default function InvoicePDF({ invoice }) {
  const date = invoice.date?.toDate?.().toLocaleDateString?.("fr-FR") ?? "";
  const ht = Number(invoice.amountHT ?? 0).toFixed(2);
  const tva = Number(invoice.tva ?? 0).toFixed(2);
  const ttc = Number(invoice.totalTTC ?? 0).toFixed(2);
  const tvaRate = invoice.tvaRate ?? 0;
  const mentionLegale = invoice.mentionLegale ?? "";
  const ref = invoice.id ? `FAC-${invoice.id.slice(0, 8).toUpperCase()}` : "FAC-XXXXXX";
  const badge = statusColor(invoice.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── En-tête ── */}
        <View style={styles.header}>
          <View>
            {invoice.logoDataUrl
              ? <Image src={invoice.logoDataUrl} style={styles.logo} />
              : <Text style={styles.companyName}>{invoice.entrepriseNom || "Factur'Peyi"}</Text>
            }
            {invoice.logoDataUrl && (
              <Text style={styles.companyName}>{invoice.entrepriseNom || "Factur'Peyi"}</Text>
            )}
            {invoice.entrepriseAdresse && <Text style={styles.companyDetail}>{invoice.entrepriseAdresse}</Text>}
            {invoice.entrepriseSiret  && <Text style={styles.companyDetail}>SIRET : {invoice.entrepriseSiret}</Text>}
            {invoice.entrepriseTel    && <Text style={styles.companyDetail}>Tél : {invoice.entrepriseTel}</Text>}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceRef}>Réf. {ref}</Text>
            <Text style={styles.invoiceRef}>Date : {date}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.clientLabel}>Facturé à</Text>
              <Text style={styles.clientName}>{invoice.clientNom}</Text>
              {invoice.clientAdresse && <Text style={styles.clientDetail}>{invoice.clientAdresse}</Text>}
              {invoice.clientEmail   && <Text style={styles.clientDetail}>{invoice.clientEmail}</Text>}
            </View>
          </View>
        </View>

        {/* ── Tableau des lignes ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>P.U. HT</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cellText, styles.colDesc]}>{invoice.description}</Text>
          <Text style={[styles.cellText, styles.colQty]}>1</Text>
          <Text style={[styles.cellText, styles.colUnit]}>{ht} €</Text>
          <Text style={[styles.cellText, styles.colTotal]}>{ht} €</Text>
        </View>

        {/* ── Totaux ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{ht} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({tvaRate}%)</Text>
            <Text style={styles.totalValue}>{tva} €</Text>
          </View>
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLabel}>Total TTC</Text>
            <Text style={styles.totalTTCValue}>{ttc} €</Text>
          </View>
        </View>

        {/* ── Statut ── */}
        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: badge.color }}>
            Statut : {invoice.status ?? "en attente"}
          </Text>
        </View>

        {/* ── Mention légale (si applicable) ── */}
        {mentionLegale ? (
          <Text style={styles.mentionLegale}>{mentionLegale}</Text>
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.separator} />
        <Text style={styles.footer}>
          Merci pour votre confiance — {invoice.entrepriseNom || "Factur'Peyi"} © {new Date().getFullYear()}
        </Text>

      </Page>
    </Document>
  );
}
