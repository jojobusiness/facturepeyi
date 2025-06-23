import React from "react";

export default function InvoiceList() {
  // Exemple statique
  const invoices = [
    { id: 1, client: "Client A", amount: 200 },
    { id: 2, client: "Client B", amount: 450 },
  ];

  return (
    <div>
      <h2>Liste des factures</h2>
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id}>
            {inv.client} - {inv.amount} €
          </li>
        ))}
      </ul>
    </div>
  );
}
