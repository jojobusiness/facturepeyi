import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: { margin: 10, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
});

export default function InvoicePDF({ invoice, logoUrl }) {
  return (
    <Document>
      <Page size="A4" style={styles.section}>
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        <Text>Facture pour {invoice.clientNom}</Text>
        <View style={styles.row}>
          <Text>Description :</Text>
          <Text>{invoice.description}</Text>
        </View>
        <View style={styles.row}>
          <Text>Montant HT :</Text>
          <Text>{Number(invoice.amountHT).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text>TVA ({invoice.tva}%) :</Text>
          <Text>{Number(invoice.amountTVA).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text>Total TTC :</Text>
          <Text>{Number(invoice.amountTTC).toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text>Statut :</Text>
          <Text>{invoice.status}</Text>
        </View>
      </Page>
    </Document>
  );
}
