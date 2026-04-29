import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entreprise, entrepriseId } = useAuth();

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ clientId: "", clientNom: "", description: "", status: "en attente", date: "" });
  const [montantHT, setMontantHT] = useState(0);
  const [tauxTVA, setTauxTVA] = useState(0);
  const [loading, setLoading] = useState(true);

  const montantTVA = montantHT ? parseFloat(montantHT) * (tauxTVA / 100) : 0;
  const montantTTC = montantHT ? parseFloat(montantHT) + montantTVA : 0;

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  useEffect(() => {
    if (!entrepriseId || !id) return;
    getDoc(doc(db, "entreprises", entrepriseId, "factures", id)).then((snap) => {
      if (!snap.exists()) { alert("Facture introuvable"); navigate("/dashboard/factures"); return; }
      const data = snap.data();
      const dateStr = data.date?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0];
      setForm({ clientId: data.clientId || "", clientNom: data.clientNom || "", description: data.description || "", status: data.status || "en attente", date: dateStr });
      setMontantHT(data.amountHT || 0);
      setTauxTVA(data.tvaRate || data.tva || 0);
      setLoading(false);
    });
  }, [entrepriseId, id, navigate]);

  const handleClientChange = (e) => {
    const client = clients.find((c) => c.id === e.target.value);
    if (client) setForm({ ...form, clientId: client.id, clientNom: client.nom });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrepriseId) return;
    try {
      await updateDoc(doc(db, "entreprises", entrepriseId, "factures", id), {
        clientId: form.clientId,
        clientNom: form.clientNom,
        description: form.description,
        status: form.status,
        amountHT: parseFloat(montantHT),
        tvaRate: parseFloat(tauxTVA),
        tva: parseFloat(montantTVA.toFixed(2)),
        totalTTC: parseFloat(montantTTC.toFixed(2)),
        date: Timestamp.fromDate(new Date(form.date)),
      });
      navigate("/dashboard/factures");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Modifier la facture</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
          <select value={form.clientId} onChange={handleClientChange} required className={inputClass}>
            <option value="">-- Sélectionner un client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Statut</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputClass}
          >
            <option value="en attente">En attente</option>
            <option value="payée">Payée</option>
            <option value="en retard">En retard</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant HT (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Taux de TVA</label>
          <select value={tauxTVA} onChange={(e) => setTauxTVA(parseFloat(e.target.value))} className={inputClass}>
            <option value={0}>0% — Exonéré</option>
            <option value={2.1}>2,1%</option>
            <option value={5.5}>5,5%</option>
            <option value={8.5}>8,5% — DOM</option>
            <option value={10}>10%</option>
            <option value={11}>11% — TGC Nouvelle-Calédonie</option>
            <option value={16}>16% — Polynésie française</option>
            <option value={20}>20% — Métropole</option>
          </select>
        </div>

        {montantHT > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Montant HT</span>
              <span>{parseFloat(montantHT).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({tauxTVA}%)</span>
              <span>{montantTVA.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Total TTC</span>
              <span>{montantTTC.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Date de facture</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className={inputClass}
          />
        </div>

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition">
          Enregistrer les modifications
        </button>
      </form>
    </main>
  );
}
