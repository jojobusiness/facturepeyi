import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

const BRAND_GREEN = "#0f5c3c";
const GRAY = "#555";
const LIGHT_GRAY = "#f5f5f5";
const BORDER = "#e0e0e0";

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", padding: 40, color: "#1a1a1a", lineHeight: 1.5 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { width: 90, height: 50, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND_GREEN },
  companyDetail: { fontSize: 9, color: GRAY, marginTop: 2 },
  infoBlock: { backgroundColor: LIGHT_GRAY, borderRadius: 4, padding: 12, textAlign: "right" },
  invoiceTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND_GREEN, marginBottom: 4 },
  invoiceRef: { fontSize: 9, color: GRAY, marginBottom: 8 },
  clientLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", marginBottom: 3 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  clientDetail: { fontSize: 9, color: GRAY, marginTop: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: BRAND_GREEN, padding: "8 12", borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { color: "#fff", fontSize: 9, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", padding: "8 12", borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" },
  colDesc: { flex: 3 },
  colQty:  { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colTotal:{ flex: 1, textAlign: "right" },
  cellText: { fontSize: 9, color: "#333" },
  totalsBox: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 9, color: "#333" },
  totalTTCRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: BRAND_GREEN, borderRadius: 4, padding: "8 12", marginTop: 4 },
  totalTTCLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#fff" },
  totalTTCValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#fff" },
  statusBadge: { marginTop: 16, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4 },
  validityBox: { marginTop: 12, fontSize: 9, color: "#92400e", backgroundColor: "#fef3c7", borderRadius: 4, padding: "6 10" },
  mentionLegale: { marginTop: 16, fontSize: 8, color: "#2563eb", backgroundColor: "#eff6ff", borderRadius: 4, padding: "6 10" },
  separator: { height: 1, backgroundColor: BORDER, marginTop: 24, marginBottom: 8 },
  footer: { fontSize: 8, color: GRAY, textAlign: "center" },
});

function statusColor(status) {
  switch (status) {
    case "accepté": return { backgroundColor: "#dcfce7", color: "#166534" };
    case "refusé":  return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "envoyé":  return { backgroundColor: "#dbeafe", color: "#1e40af" };
    default:        return { backgroundColor: "#f3f4f6", color: "#374151" };
  }
}

function fmtDate(d) {
  if (!d) return "";
  try {
    const date = typeof d.toDate === "function" ? d.toDate() : new Date(d);
    return isNaN(date) ? "" : date.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

export default function DevisPDF({ devis }) {
  const date = fmtDate(devis.date);
  const validite = fmtDate(devis.dateValidite);
  const ht = Number(devis.amountHT ?? 0).toFixed(2);
  const tva = Number(devis.tva ?? 0).toFixed(2);
  const ttc = Number(devis.totalTTC ?? 0).toFixed(2);
  const tvaRate = devis.tvaRate ?? 0;
  const mentionLegale = devis.mentionLegale ?? "";
  const ref = devis.id ? `DEV-${devis.id.slice(0, 8).toUpperCase()}` : "DEV-XXXXXX";
  const badge = statusColor(devis.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {devis.logoDataUrl
              ? <Image src={devis.logoDataUrl} style={styles.logo} />
              : <Text style={styles.companyName}>{devis.entrepriseNom || "Factur'Peyi"}</Text>
            }
            {devis.logoDataUrl && (
              <Text style={styles.companyName}>{devis.entrepriseNom || "Factur'Peyi"}</Text>
            )}
            {devis.entrepriseAdresse && <Text style={styles.companyDetail}>{devis.entrepriseAdresse}</Text>}
            {devis.entrepriseSiret  && <Text style={styles.companyDetail}>SIRET : {devis.entrepriseSiret}</Text>}
            {devis.entrepriseTel    && <Text style={styles.companyDetail}>Tél : {devis.entrepriseTel}</Text>}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.invoiceTitle}>DEVIS</Text>
            <Text style={styles.invoiceRef}>Réf. {ref}</Text>
            <Text style={styles.invoiceRef}>Date : {date}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.clientLabel}>Adressé à</Text>
              <Text style={styles.clientName}>{devis.clientNom}</Text>
              {devis.clientAdresse && <Text style={styles.clientDetail}>{devis.clientAdresse}</Text>}
              {devis.clientEmail   && <Text style={styles.clientDetail}>{devis.clientEmail}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>P.U. HT</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cellText, styles.colDesc]}>{devis.description}</Text>
          <Text style={[styles.cellText, styles.colQty]}>1</Text>
          <Text style={[styles.cellText, styles.colUnit]}>{ht} €</Text>
          <Text style={[styles.cellText, styles.colTotal]}>{ht} €</Text>
        </View>

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

        <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: badge.color }}>
            Statut : {devis.status ?? "brouillon"}
          </Text>
        </View>

        {validite ? (
          <Text style={styles.validityBox}>Devis valable jusqu'au {validite}.</Text>
        ) : null}

        {mentionLegale ? (
          <Text style={styles.mentionLegale}>{mentionLegale}</Text>
        ) : null}

        <View style={styles.separator} />
        <Text style={styles.footer}>
          Devis émis par {devis.entrepriseNom || "Factur'Peyi"} — Document non contractuel, valant proposition commerciale.
        </Text>

      </Page>
    </Document>
  );
}
