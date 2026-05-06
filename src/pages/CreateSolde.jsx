import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CreateSolde() {
  const { acompteId } = useParams();
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();

  const [acompte, setAcompte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [description, setDescription] = useState("");
  const [montantSoldeHT, setMontantSoldeHT] = useState("");
  const [tvaRate, setTvaRate] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const ht = parseFloat(montantSoldeHT) || 0;
  const tvaAmount = tvaRate !== null ? parseFloat((ht * (tvaRate / 100)).toFixed(2)) : 0;
  const totalTTC = parseFloat((ht + tvaAmount).toFixed(2));
  const mentionLegale = entreprise?.mentionLegale || acompte?.mentionLegale || "";

  useEffect(() => {
    if (!entrepriseId || !acompteId) return;
    getDoc(doc(db, "entreprises", entrepriseId, "factures", acompteId))
      .then((snap) => {
        if (!snap.exists()) { setError("Acompte introuvable."); setLoading(false); return; }
        const data = snap.data();
        if (data.type !== "acompte") { setError("Cette facture n'est pas un acompte."); setLoading(false); return; }
        if (data.soldeFactureId) { setError("La facture de solde a déjà été créée."); setLoading(false); return; }
        setAcompte({ id: snap.id, ...data });
        const soldeHT = data.montantBase ? parseFloat((data.montantBase - data.amountHT).toFixed(2)) : 0;
        setMontantSoldeHT(soldeHT > 0 ? String(soldeHT) : "");
        setTvaRate(data.tvaRate ?? entreprise?.tvaRate ?? 0);
        const originalDescription = data.prestationOriginale || data.description?.replace(/^Acompte \d+% — /, "") || "";
        setDescription(`Solde — ${originalDescription}`);
        setLoading(false);
      })
      .catch(() => { setError("Erreur de chargement."); setLoading(false); });
  }, [entrepriseId, acompteId, entreprise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ht || ht <= 0) return alert("Le montant du solde est requis.");

    const soldeRef = await addDoc(collection(db, "entreprises", entrepriseId, "factures"), {
      clientId: acompte.clientId,
      clientNom: acompte.clientNom,
      clientEmail: acompte.clientEmail,
      description,
      amountHT: ht,
      tva: tvaAmount,
      totalTTC,
      tvaRate: tvaRate ?? 0,
      mentionLegale,
      date: Timestamp.fromDate(new Date(date)),
      status: "en attente",
      createdAt: Timestamp.now(),
      entrepriseId,
      type: "solde",
      acompteFactureId: acompteId,
      montantAcompteHT: acompte.amountHT,
    });

    await updateDoc(doc(db, "entreprises", entrepriseId, "factures", acompteId), {
      soldeFactureId: soldeRef.id,
    });

    navigate("/dashboard/factures");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <main className="max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate("/dashboard/factures")}
            className="mt-4 text-sm text-gray-500 underline"
          >
            Retour aux factures
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0d1b3e]">Facture de solde</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Solde suite à l'acompte de <span className="font-medium text-[#0d1b3e]">{acompte.totalTTC?.toFixed(2)} €</span> versé par {acompte.clientNom}.
        </p>
      </div>

      {/* Résumé acompte */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm mb-5">
        <p className="text-blue-700 font-semibold mb-1">Acompte déjà réglé</p>
        <div className="flex justify-between text-blue-600">
          <span>Acompte {acompte.acomptePercent}%</span>
          <span>{acompte.amountHT?.toFixed(2)} € HT — {acompte.totalTTC?.toFixed(2)} € TTC</span>
        </div>
        {acompte.montantBase && (
          <div className="flex justify-between text-blue-500 text-xs mt-1">
            <span>Contrat total HT</span>
            <span>{acompte.montantBase?.toFixed(2)} €</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

        {/* Description */}
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

        {/* Montant solde HT */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant du solde (HT)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={montantSoldeHT}
            onChange={(e) => setMontantSoldeHT(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
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
        {ht > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Solde HT</span>
              <span>{ht.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>TVA ({tvaRate}%)</span>
              <span>{tvaAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-2">
              <span>Total solde TTC</span>
              <span>{totalTTC.toFixed(2)} €</span>
            </div>
            {acompte.montantBase && (
              <div className="flex justify-between text-emerald-600 text-xs font-medium pt-1">
                <span>Total contrat TTC (acompte + solde)</span>
                <span>{(acompte.totalTTC + totalTTC).toFixed(2)} €</span>
              </div>
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
          Créer la facture de solde
        </button>
      </form>
    </main>
  );
}
