import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import PlanGate from "../components/PlanGate";
import { FaSync } from "react-icons/fa";

const FREQ_OPTIONS = [
  { value: "monthly",   label: "Mensuelle",     desc: "Générée le même jour chaque mois" },
  { value: "quarterly", label: "Trimestrielle", desc: "Générée tous les 3 mois" },
  { value: "yearly",    label: "Annuelle",      desc: "Générée une fois par an" },
];

function nextDate(startStr, frequence) {
  const d = new Date(startStr);
  if (frequence === "monthly")   d.setMonth(d.getMonth() + 1);
  if (frequence === "quarterly") d.setMonth(d.getMonth() + 3);
  if (frequence === "yearly")    d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default function CreateRecurrence() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients]       = useState([]);
  const [clientId, setClientId]     = useState("");
  const [description, setDesc]      = useState("");
  const [amount, setAmount]         = useState("");
  const [tvaRate, setTvaRate]       = useState(null);
  const [frequence, setFrequence]   = useState("monthly");
  const [startDate, setStartDate]   = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const canUse = canUseFeature(entreprise?.plan || "decouverte", "recurrence");

  useEffect(() => {
    if (entreprise && tvaRate === null) setTvaRate(entreprise.tvaRate ?? 0);
  }, [entreprise, tvaRate]);

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  const ht  = amount ? parseFloat(amount) : 0;
  const tva = tvaRate !== null ? parseFloat((ht * (tvaRate / 100)).toFixed(2)) : 0;
  const ttc = parseFloat((ht + tva).toFixed(2));
  const firstNext = startDate ? nextDate(startDate, frequence) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!clientId) return setError("Veuillez sélectionner un client.");

    setSaving(true);
    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const start = new Date(startDate);
      const next  = nextDate(startDate, frequence);

      await addDoc(collection(db, "entreprises", entrepriseId, "recurrences"), {
        clientId,
        clientNom:     selectedClient?.nom || "",
        clientEmail:   selectedClient?.email || "",
        description,
        amountHT:      parseFloat(ht.toFixed(2)),
        tvaRate:       tvaRate ?? 0,
        tva:           tva,
        totalTTC:      ttc,
        mentionLegale: entreprise?.mentionLegale || "",
        frequence,
        startDate:     Timestamp.fromDate(start),
        nextDate:      Timestamp.fromDate(next),
        active:        true,
        createdAt:     Timestamp.now(),
        lastGeneratedAt: null,
        entrepriseId,
      });

      navigate("/dashboard/factures/recurrentes");
    } catch {
      setError("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (!canUse) {
    return (
      <main className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[#0d1b3e] mb-2">Nouvelle facture récurrente</h2>
        <p className="text-sm text-gray-400 mb-6">Automatisez votre facturation mensuelle ou trimestrielle.</p>
        <PlanGate
          reason="Les factures récurrentes sont disponibles à partir du plan Pro."
          upgradeRequired="pro"
        />
      </main>
    );
  }

  if (tvaRate === null) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
          <FaSync className="text-emerald-600 w-3.5 h-3.5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Nouvelle facture récurrente</h2>
          <p className="text-sm text-gray-400">Générée automatiquement selon la fréquence choisie.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Client */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0d1b3e]">Client & Prestation</h3>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
            <input
              type="text"
              placeholder="Abonnement maintenance, Loyer local, Prestation mensuelle..."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </section>

        {/* Montant */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0d1b3e]">Montant</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Montant HT (€)</label>
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
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">TVA</label>
              <select
                value={tvaRate}
                onChange={(e) => setTvaRate(parseFloat(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value={0}>0%</option>
                <option value={2.1}>2,1%</option>
                <option value={5.5}>5,5%</option>
                <option value={8.5}>8,5% DOM</option>
                <option value={10}>10%</option>
                <option value={11}>11% TGC</option>
                <option value={16}>16% Polynésie</option>
                <option value={20}>20%</option>
              </select>
            </div>
          </div>

          {amount && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>HT</span><span>{ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>TVA ({tvaRate}%)</span><span>{tva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-1.5">
                <span>Total TTC</span><span>{ttc.toFixed(2)} €</span>
              </div>
              {entreprise?.mentionLegale && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">
                  {entreprise.mentionLegale}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Récurrence */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0d1b3e]">Fréquence de génération</h3>

          <div className="grid grid-cols-3 gap-3">
            {FREQ_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequence(opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  frequence === opt.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`text-sm font-bold mb-0.5 ${frequence === opt.value ? "text-emerald-700" : "text-[#0d1b3e]"}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-400 leading-tight">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Date de première génération
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {firstNext && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <FaSync className="text-emerald-500 w-3 h-3 flex-shrink-0" />
              <p className="text-xs text-emerald-700">
                La 1ère facture sera générée le <strong>{new Date(startDate).toLocaleDateString("fr-FR")}</strong>,
                puis la suivante le <strong>{firstNext.toLocaleDateString("fr-FR")}</strong>.
              </p>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/factures/recurrentes")}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
                Enregistrement...
              </>
            ) : "Créer la récurrence"}
          </button>
        </div>
      </form>
    </main>
  );
}
