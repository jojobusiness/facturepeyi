export default function InvoicePDF({ invoice }) {
  if (!invoice) return null;

  return (
    <div
      id="invoice-pdf"
      style={{
        backgroundColor: "#fff",
        width: "600px",
        padding: "20px",
        fontSize: "14px",
        color: "#000",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        border: "1px solid #ccc",
        borderRadius: "6px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "20px" }}>
        Facture #{invoice.id}
      </h2>

      <p><strong>Client :</strong> {invoice.clientNom}</p>
      <p><strong>Description :</strong> {invoice.description}</p>
      <p><strong>Montant :</strong> {invoice.amount} €</p>
      <p><strong>Statut :</strong> {invoice.status}</p>
      <p><strong>Date :</strong> {invoice.date?.toDate().toLocaleDateString()}</p>

      <div style={{
        marginTop: "30px",
        borderTop: "1px solid #eee",
        paddingTop: "15px",
        textAlign: "right"
      }}>
        <p style={{ fontSize: "18px", fontWeight: "bold" }}>
          Total : {invoice.amount} €
        </p>
      </div>
    </div>
  );
}