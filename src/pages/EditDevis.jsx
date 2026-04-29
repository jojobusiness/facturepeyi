import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc, getDocs,
  collection, addDoc, Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const STATUTS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "envoyé",    label: "Envoyé" },
  { value: "accepté",   label: "Accepté" },
  { value: "refusé",    label: "Refusé" },
];

export default function EditDevis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entreprise, entrepriseId } = useAuth();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [tvaRate, setTvaRate] = useState(0);
  const [date, setDate] = useState("");
  const [validiteJours, setValiditeJours] = useState(30);
  const [status, setStatus] = useState("brouillon");
  const [convertedToFacture, setConvertedToFacture] = useState(false);
  const [factureId, setFactureId] = useState(null);
  const [loading, setLoading] = useState(true);

  const tvaAmount = amount ? parseFloat(amount) * (tvaRate / 100) : 0;
  const totalTTC = amount ? parseFloat(amount) + tvaAmount : 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  useEffect(() => {
    if (!entrepriseId || !id) return;
    getDoc(doc(db, "entreprises", entrepriseId, "devis", id)).then((snap) => {
      if (!snap.exists()) { navigate("/dashboard/devis"); return; }
      const data = snap.data();
      setClientId(data.clientId || "");
      setDescription(data.description || "");
      setAmount(data.amountHT?.toString() || "");
      setTvaRate(data.tvaRate ?? 0);
      setDate(data.date?.toDate().toISOString().split("T")[0] || "");
      setValiditeJours(data.validiteJours || 30);
      setStatus(data.status || "brouillon");
      setConvertedToFacture(data.convertedToFacture || false);
      setFactureId(data.factureId || null);
      setLoading(false);
    });
  }, [entrepriseId, id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ht = parseFloat(parseFloat(amount).toFixed(2));
      const tva = parseFloat(tvaAmount.toFixed(2));
      const ttc = parseFloat(totalTTC.toFixed(2));
      const selectedClient = clients.find((c) => c.id === clientId);

      const dateObj = new Date(date);
      const dateExpiration = new Date(dateObj);
      dateExpiration.setDate(dateExpiration.getDate() + parseInt(validiteJours));

      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", id), {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        description,
        amountHT: ht,
        tva,
        totalTTC: ttc,
        tvaRate,
        mentionLegale,
        date: Timestamp.fromDate(dateObj),
        dateExpiration: Timestamp.fromDate(dateExpiration),
        validiteJours: parseInt(validiteJours),
        status,
      });
      navigate("/dashboard/devis");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleConvert = async () => {
    if (!window.confirm("Convertir ce devis en facture ?")) return;
    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const ht = parseFloat(parseFloat(amount).toFixed(2));
      const tva = parseFloat(tvaAmount.toFixed(2));
      const ttc = parseFloat(totalTTC.toFixed(2));

      const ref = await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        description,
        amountHT: ht,
        tva,
        totalTTC: ttc,
        tvaRate,
        mentionLegale,
        date: Timestamp.now(),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
        sourceDevisId: id,
      });

      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", id), {
        convertedToFacture: true,
        factureId: ref.id,
        status: "accepté",
      });

      navigate(`/dashboard/facture/modifier/${ref.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la conversion.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Modifier le devis</h2>
        {convertedToFacture && (
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">
            Converti en facture
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

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

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant HT (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Taux de TVA</label>
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

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Date du devis</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Validité</label>
          <select
            value={validiteJours}
            onChange={(e) => setValiditeJours(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={15}>15 jours</option>
            <option value={30}>30 jours</option>
            <option value={45}>45 jours</option>
            <option value={60}>60 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
        >
          Enregistrer les modifications
        </button>
      </form>

      {!convertedToFacture && (
        <div className="mt-4 bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 text-lg font-bold">
              →
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0d1b3e]">Convertir en facture</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Le devis sera marqué comme accepté et une facture sera créée automatiquement.
              </p>
            </div>
            <button
              onClick={handleConvert}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex-shrink-0"
            >
              Convertir
            </button>
          </div>
        </div>
      )}

      {convertedToFacture && factureId && (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-700">Devis converti en facture</p>
            <button
              onClick={() => navigate(`/dashboard/facture/modifier/${factureId}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Voir la facture
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
