import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    client: "",
    description: "",
    amount: "",
    status: "en attente",
  });

useEffect(() => {
  const fetchInvoice = async () => {
    try {
      if (!id) {
        console.error("ID de facture manquant");
        return;
      }

      const docRef = doc(db, "factures", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        console.log("Facture récupérée :", data);

        setForm({
          client: data.client || "",
          description: data.description || "",
          amount: data.amount || "",
          status: data.status || "en attente",
        });
      } else {
        alert("La facture n'existe pas.");
        navigate("/factures");
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la facture :", err);
      alert("Erreur lors du chargement de la facture.");
      navigate("/factures");
    }
  };

  fetchInvoice();
}, [id, navigate]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "factures", id), {
        ...form,
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
        <input type="text" name="client" value={form.client} onChange={handleChange} placeholder="Client" className="w-full p-2 border rounded" required />
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