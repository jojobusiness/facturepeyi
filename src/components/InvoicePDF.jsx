import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Tu peux enregistrer une font personnalisée si tu veux ici
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica/v6/KFOmCnqEu92Fr1Mu4mxP.ttf" }
  ]
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
    height: "auto",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyInfo: {
    fontSize: 14,
    fontWeight: "bold",
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

export default function InvoicePDF({ invoice, logoUrl }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête avec logo et entreprise */}
        <View style={styles.header}>
          <View>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <Text style={styles.companyInfo}>FacturPeyi</Text>
            <Text>Système de facturation en ligne</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text>Facturé à :</Text>
            <Text>{invoice.clientNom}</Text>
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
          <Text>{Number(invoice.amountTVA).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total TTC :</Text>
          <Text>{Number(invoice.amountTTC).toFixed(2)} €</Text>
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