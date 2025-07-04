import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateInvoice() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  // 🔁 Charger la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snapshot = await getDocs(collection(db, "clients"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setClients(data);
      } catch (err) {
        console.error("Erreur chargement clients :", err);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      alert("Veuillez sélectionner un client.");
      return;
    }

    try {
      const selectedClient = clients.find((c) => c.id === clientId);

      const newInvoice = {
        clientId,
        clientNom: selectedClient?.nom || "",
        description,
        amount: parseFloat(amount),
        date: Timestamp.fromDate(new Date(date)),
        status: "en attente",
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "factures"), newInvoice);
      alert("Facture enregistrée !");
      navigate("/factures");
    } catch (err) {
      console.error("Erreur Firestore :", err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Créer une facture</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        {/* Sélecteur de client */}
        <label className="block text-sm font-medium">Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full border p-2 rounded"
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nom}
            </option>
          ))}
        </select>

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
        <button
          onClick={() => navigate("/dashboard")}
          type="button"
          className="mb-4 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
        >
          ← Retour au tableau de bord
        </button>
      </form>
    </main>
  );
}