// src/components/InvoicePDF.jsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  bold: { fontWeight: 'bold' },
  logo: { width: 100, height: 50, marginBottom: 10 },
  line: { height: 1, backgroundColor: '#ccc', marginVertical: 8 },
});

export default function InvoicePDF({ invoice, entreprise }) {
  const date = invoice?.date?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        {entreprise?.logo && (
          <Image src={entreprise.logo} style={styles.logo} />
        )}

        {/* En-tête entreprise */}
        <View style={styles.section}>
          <Text style={styles.header}>{entreprise?.nom || "Entreprise"}</Text>
          {entreprise?.siret && <Text>SIRET : {entreprise.siret}</Text>}
          {entreprise?.email && <Text>Email : {entreprise.email}</Text>}
        </View>

        <View style={styles.line} />

        {/* Infos facture */}
        <View style={styles.section}>
          <Text style={styles.bold}>Facture à :</Text>
          <Text>{invoice.clientNom}</Text>
          <Text>Date : {date}</Text>
          <Text>Statut : {invoice.status}</Text>
        </View>

        {/* Détails facture */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Description :</Text>
            <Text>{invoice.description}</Text>
          </View>

          <View style={styles.row}>
            <Text>Montant HT :</Text>
            <Text>{Number(invoice.amountHT).toFixed(2)} €</Text>
          </View>

          <View style={styles.row}>
            <Text>TVA ({invoice.tva || 0}%) :</Text>
            <Text>{Number(invoice.amountTVA || 0).toFixed(2)} €</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.bold}>Total TTC :</Text>
            <Text style={styles.bold}>{Number(invoice.amountTTC || 0).toFixed(2)} €</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}