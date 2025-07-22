import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateInvoice() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [tvaRate, setTvaRate] = useState(0);
  const [tvaAmount, setTvaAmount] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);

  const [entrepriseId, setEntrepriseId] = useState(null);
  const navigate = useNavigate();

  // ✅ 1. On récupère entrepriseId de l'utilisateur
  useEffect(() => {
    const fetchEntreprise = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userDoc = await getDoc(doc(db, "utilisateurs", uid));
      const data = userDoc.data();
      setEntrepriseId(data?.entrepriseId || null);
    };
    fetchEntreprise();
  }, []);

  // ✅ 2. Charger les clients liés à cette entreprise
  useEffect(() => {
    if (!entrepriseId) return;

    const fetchClients = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "entreprises", entrepriseId, "clients")
        );
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setClients(data);
      } catch (err) {
        console.error("Erreur chargement clients :", err);
      }
    };

    fetchClients();
  }, [entrepriseId]);

  // ✅ 3. Calculs TVA / Total
  useEffect(() => {
    const base = parseFloat(amount);
    const taux = parseFloat(tvaRate);
    if (!isNaN(base)) {
      const tva = base * (taux / 100);
      setTvaAmount(tva);
      setTotalTTC(base + tva);
    } else {
      setTvaAmount(0);
      setTotalTTC(0);
    }
  }, [amount, tvaRate]);

  // ✅ 4. Enregistrer la facture dans /entreprises/{entrepriseId}/factures
  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    const userDoc = await getDoc(doc(db, "utilisateurs", uid));
    const entrepriseId = userDoc.data()?.entrepriseId;

    if (!clientId) return alert("Veuillez sélectionner un client.");
    if (!uid || !entrepriseId) return alert("Utilisateur non connecté.");

    try {
      const selectedClient = clients.find((c) => c.id === clientId);

      const newInvoice = {
        clientId,
        clientNom: selectedClient?.nom || "",
        description,
        amountHT: parseFloat(amount),
        tva: parseFloat(tvaAmount.toFixed(2)),
        totalTTC: parseFloat(totalTTC.toFixed(2)),
        tvaRate: parseFloat(tvaRate),
        date: Timestamp.fromDate(new Date(date)),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
      };

      await addDoc(
        collection(db, "entreprises", entrepriseId, "factures"),
        newInvoice
      );

      alert("Facture enregistrée !");
      navigate("/dashboard/factures");
    } catch (err) {
      console.error("Erreur Firestore :", err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-6">Créer une facture</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
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
          placeholder="Montant HT (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <div>
          <label className="block text-sm font-medium">TVA (%)</label>
          <select
            value={tvaRate}
            onChange={(e) => setTvaRate(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value={0}>0%</option>
            <option value={2.1}>2.1%</option>
            <option value={5.5}>5.5%</option>
            <option value={8.5}>8.5%</option>
            <option value={10}>10%</option>
            <option value={20}>20%</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          <p>TVA ({tvaRate}%) : <strong>{tvaAmount.toFixed(2)} €</strong></p>
          <p>Total TTC : <strong>{totalTTC.toFixed(2)} €</strong></p>
        </div>

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
          💾 Enregistrer la facture
        </button>

      </form>
    </main>
  );
}