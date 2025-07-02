import React from "react";

export default function InvoicePDF({ invoice }) {
  if (!invoice) return null;

  return (
    <div id="pdf-content" className="p-6 bg-white w-[600px] text-sm">
      <h2 className="text-2xl font-bold mb-4">Facture #{invoice.id}</h2>

      <p><strong>Client :</strong> {invoice.clientNom}</p>
      <p><strong>Description :</strong> {invoice.description}</p>
      <p><strong>Montant :</strong> {invoice.amount} €</p>
      <p><strong>Statut :</strong> {invoice.status}</p>
      <p><strong>Date :</strong> {invoice.date?.toDate().toLocaleDateString()}</p>

      <div className="mt-8 border-t pt-4 text-right">
        <p className="text-lg font-bold">Total : {invoice.amount} €</p>
      </div>
    </div>
  );
}
