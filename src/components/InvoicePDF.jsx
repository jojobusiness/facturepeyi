import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica/v6/KFOmCnqEu92Fr1Mu4mxP.ttf" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 40,
    lineHeight: 1.5,
    color: "#333",
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: "contain",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyInfo: {
    fontSize: 12,
    marginTop: 10,
  },
  clientInfo: {
    textAlign: "right",
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  label: {
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    fontSize: 11,
    textAlign: "center",
    color: "#777",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
  },
});

export default function InvoicePDF({ invoice }) {
  const date = invoice.date?.toDate?.().toLocaleDateString?.() || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text>LOGO LENGTH: {invoice.logoDataUrl?.length || "none"}</Text>
        {/* En-tête avec logo et entreprise */}
        <View style={styles.header}>
          <View>
            {invoice.logoDataUrl && <Image src={invoice.logoDataUrl} style={styles.logo} />}
            <Text style={styles.companyInfo}>{invoice.entrepriseNom || "FacturPeyi"}</Text>
            {invoice.entrepriseAdresse && <Text>{invoice.entrepriseAdresse}</Text>}
            {invoice.entrepriseSiret && <Text>SIRET : {invoice.entrepriseSiret}</Text>}
          </View>

          <View style={styles.clientInfo}>
            <Text>Facturé à :</Text>
            <Text>{invoice.clientNom}</Text>
            {invoice.clientAdresse && <Text>{invoice.clientAdresse}</Text>}
            {invoice.clientEmail && <Text>{invoice.clientEmail}</Text>}
            {date && <Text>Date : {date}</Text>}
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>Facture</Text>

        {/* Détails */}
        <View style={styles.row}>
          <Text style={styles.label}>Description :</Text>
          <Text>{invoice.description}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Montant HT :</Text>
          <Text>{Number(invoice.amountHT).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>TVA ({invoice.tva}%) :</Text>
          <Text>{Number(invoice.tva).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total TTC :</Text>
          <Text>{Number(invoice.totalTTC).toFixed(2)} €</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={styles.label}>Statut de la facture :</Text>
          <Text>{invoice.status}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Merci pour votre confiance • FacturPeyi © {new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}