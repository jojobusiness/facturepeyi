import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientId: prefilledClientId || "",
    clientNom: "",
    description: "",
    amount: "",
    status: "en attente",
  });

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Récupérer les clients
      const clientSnap = await getDocs(collection(db, "clients"));
      const clientList = clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);

      // Récupérer la facture
      if (!id) return alert("ID facture manquant");

      const docRef = doc(db, "factures", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setForm({
          clientId: data.clientId || "",
          clientNom: data.clientNom || "",
          description: data.description || "",
          amount: data.amount || "",
          status: data.status || "en attente",
        });
      } else {
        alert("Facture introuvable");
        navigate("/factures");
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e) => {
    const client = clients.find(c => c.id === e.target.value);
    setForm({ ...form, clientId: client.id, clientNom: client.nom });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateDoc(doc(db, "factures", id), {
        clientId: form.clientId,
        clientNom: form.clientNom,
        description: form.description,
        amount: form.amount,
        status: form.status,
      });

      alert("Facture modifiée !");
      navigate("/factures");
    } catch (err) {
      console.error(err);
      alert("Erreur modification.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Modifier la facture</h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4 max-w-md">
        <select value={form.clientId} onChange={handleClientChange} className="w-full p-2 border rounded" required>
          <option value="">-- Sélectionner un client --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full p-2 border rounded" required />
        <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Montant (€)" className="w-full p-2 border rounded" required />
        <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="en attente">En attente</option>
          <option value="payée">Payée</option>
          <option value="annulée">Annulée</option>
        </select>

        <button type="submit" className="bg-[#1B5E20] text-white w-full p-2 rounded">Enregistrer</button>
      </form>
    </main>
  );
}