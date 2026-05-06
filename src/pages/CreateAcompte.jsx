import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import PlanGate from "../components/PlanGate";

const PRESETS = [30, 40, 50, 70];

export default function CreateAcompte() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [prestation, setPrestation] = useState("");
  const [montantBase, setMontantBase] = useState("");
  const [acomptePercent, setAcomptePercent] = useState(30);
  const [customPercent, setCustomPercent] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tvaRate, setTvaRate] = useState(null);

  const percent = useCustom ? parseFloat(customPercent) || 0 : acomptePercent;
  const base = parseFloat(montantBase) || 0;
  const acompteHT = parseFloat((base * percent / 100).toFixed(2));
  const tvaAmount = tvaRate !== null ? parseFloat((acompteHT * (tvaRate / 100)).toFixed(2)) : 0;
  const totalTTC = parseFloat((acompteHT + tvaAmount).toFixed(2));
  const mentionLegale = entreprise?.mentionLegale || "";

  const planOk = canUseFeature(entreprise?.plan || "decouverte", "acompte");

  useEffect(() => {
    if (entreprise && tvaRate === null) {
      setTvaRate(entreprise.tvaRate ?? 0);
    }
  }, [entreprise, tvaRate]);

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");
    if (!base || base <= 0) return alert("Le montant total du contrat est requis.");
    if (percent <= 0 || percent > 100) return alert("Le pourcentage doit être entre 1 et 100.");

    const selectedClient = clients.find((c) => c.id === clientId);

    await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
      clientId,
      clientNom: selectedClient?.nom || "",
      clientEmail: selectedClient?.email || "",
      description: `Acompte ${percent}% — ${prestation}`,
      amountHT: acompteHT,
      tva: tvaAmount,
      totalTTC,
      tvaRate: tvaRate ?? 0,
      mentionLegale,
      date: Timestamp.fromDate(new Date(date)),
      status: "en attente",
      createdAt: Timestamp.now(),
      entrepriseId,
      type: "acompte",
      acomptePercent: percent,
      montantBase: base,
      prestationOriginale: prestation,
    });

    navigate("/dashboard/factures");
  };

  if (tvaRate === null) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement de la configuration fiscale...
      </div>
    );
  }

  if (!planOk) {
    return (
      <main className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Facture d'acompte</h2>
        <PlanGate
          reason="Les factures d'acompte sont disponibles à partir du plan Pro."
          upgradeRequired="pro"
        />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Facture d'acompte</h2>
        <p className="text-sm text-gray-400 mt-0.5">Facturez un acompte sur un contrat, le solde en 1 clic ensuite.</p>
      </div>

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

        {/* Prestation */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Description de la prestation</label>
          <input
            type="text"
            placeholder="Développement site web, travaux de peinture..."
            value={prestation}
            onChange={(e) => setPrestation(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Montant total du contrat */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant total du contrat (HT)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={montantBase}
            onChange={(e) => setMontantBase(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Pourcentage d'acompte */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Pourcentage d'acompte</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setAcomptePercent(p); setUseCustom(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  !useCustom && acomptePercent === p
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                useCustom ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Autre
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="Ex: 25"
              value={customPercent}
              onChange={(e) => setCustomPercent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* TVA */}
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

        {/* Récapitulatif */}
        {base > 0 && percent > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Contrat total HT</span>
              <span>{base.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Acompte {percent}% (HT)</span>
              <span className="font-medium text-[#0d1b3e]">{acompteHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>TVA ({tvaRate}%)</span>
              <span>{tvaAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-2">
              <span>Acompte TTC à facturer</span>
              <span>{totalTTC.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Solde restant HT</span>
              <span>{(base - acompteHT).toFixed(2)} €</span>
            </div>
            {mentionLegale && (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">
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
          Créer la facture d'acompte
        </button>
      </form>
    </main>
  );
}
