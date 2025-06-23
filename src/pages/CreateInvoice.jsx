import React, { useState } from "react";

export default function CreateInvoice() {
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Facture créée pour ${client} de ${amount} €`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer une nouvelle facture</h2>
      <input
        type="text"
        placeholder="Nom du client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Montant"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit">Créer</button>
    </form>
  );
}
