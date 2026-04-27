import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CreateInvoice() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // TVA pré-remplie depuis la config entreprise, modifiable si besoin
  const [tvaRate, setTvaRate] = useState(null);

  // Sync tvaRate quand l'entreprise est chargée depuis le contexte
  useEffect(() => {
    if (entreprise && tvaRate === null) {
      setTvaRate(entreprise.tvaRate ?? 0);
    }
  }, [entreprise, tvaRate]);

  const tvaAmount = tvaRate !== null && amount ? parseFloat(amount) * (tvaRate / 100) : 0;
  const totalTTC = tvaRate !== null && amount ? parseFloat(amount) + tvaAmount : 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  // Charger les clients
  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error("Erreur chargement clients :", err));
  }, [entrepriseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");
    if (!entrepriseId) return alert("Entreprise introuvable.");

    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const ht = parseFloat(parseFloat(amount).toFixed(2));
      const tva = parseFloat(tvaAmount.toFixed(2));
      const ttc = parseFloat(totalTTC.toFixed(2));

      await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        description,
        amountHT: ht,
        tva,
        totalTTC: ttc,
        tvaRate: tvaRate ?? 0,
        mentionLegale,
        date: Timestamp.fromDate(new Date(date)),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
      });

      navigate("/dashboard/factures");
    } catch (err) {
      console.error("Erreur Firestore :", err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  if (tvaRate === null) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement de la configuration fiscale...
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Créer une facture</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

        {/* Client */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Sélectionner un client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
          <input
            type="text"
            placeholder="Prestation de service, matériaux..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Montant HT */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant HT (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* TVA */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600">Taux de TVA</label>
            {entreprise?.territoire && (
              <span className="text-xs text-gray-400">
                Configuré pour {entreprise.territoire} — modifiable ici si besoin
              </span>
            )}
          </div>
          <select
            value={tvaRate}
            onChange={(e) => setTvaRate(parseFloat(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
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

        {/* Récapitulatif */}
        {amount && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Montant HT</span>
              <span>{parseFloat(amount).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({tvaRate}%)</span>
              <span>{tvaAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Total TTC</span>
              <span>{totalTTC.toFixed(2)} €</span>
            </div>
            {mentionLegale && (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-2 italic">
                {mentionLegale}
              </p>
            )}
          </div>
        )}

        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Date de facture</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
        >
          Enregistrer la facture
        </button>
      </form>
    </main>
  );
}
