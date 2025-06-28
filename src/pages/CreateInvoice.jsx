import { useState } from "react";

export default function CreateInvoice() {
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInvoice = {
      client,
      description,
      amount: parseFloat(amount),
      date,
      status: "en attente"
    };
    console.log("Nouvelle facture :", newInvoice);
    alert("Facture créée !");
    // onClearForm(); // facultatif
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Créer une facture</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <input
          type="text"
          placeholder="Nom du client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Montant (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-[#1B5E20] text-white px-4 py-2 rounded hover:bg-[#2e7d32]"
        >
          Enregistrer la facture
        </button>
      </form>
    </main>
  );
}
