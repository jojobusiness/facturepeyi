import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function DepenseForm() {
  const navigate = useNavigate();
  const { entreprise, entrepriseId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ fournisseur: "", description: "", date: "", categorieId: "" });
  const [montantHT, setMontantHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState(0);
  const [montantOctroiDeMer, setMontantOctroiDeMer] = useState("");
  const [loading, setLoading] = useState(false);

  const showOctroi = entreprise?.octroiDeMer === true;
  const montantTVA = montantHT ? parseFloat(montantHT) * (tauxTVA / 100) : 0;
  const montantTTC = montantHT
    ? parseFloat(montantHT) + montantTVA + (showOctroi && montantOctroiDeMer ? parseFloat(montantOctroiDeMer) : 0)
    : 0;

  useEffect(() => {
    if (entreprise && tauxTVA === 0) setTauxTVA(entreprise.tvaRate ?? 0);
  }, [entreprise]);

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "categories"))
      .then((snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrepriseId) return alert("Entreprise introuvable.");
    setLoading(true);
    try {
      await addDoc(collection(db, "entreprises", entrepriseId, "depenses"), {
        ...formData,
        montantHT: parseFloat(montantHT),
        tauxTVA: parseFloat(tauxTVA),
        montantTVA: parseFloat(montantTVA.toFixed(2)),
        montantOctroiDeMer: showOctroi && montantOctroiDeMer ? parseFloat(parseFloat(montantOctroiDeMer).toFixed(2)) : 0,
        montantTTC: parseFloat(montantTTC.toFixed(2)),
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
        entrepriseId,
      });
      navigate("/dashboard/depenses");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Nouvelle dépense</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Fournisseur *</label>
          <input name="fournisseur" value={formData.fournisseur} onChange={handleChange} required placeholder="Nom du fournisseur" className={inputClass} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Description *</label>
          <input name="description" value={formData.description} onChange={handleChange} required placeholder="Description de la dépense" className={inputClass} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Date *</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Catégorie *</label>
          <select name="categorieId" value={formData.categorieId} onChange={handleChange} required className={inputClass}>
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Montant HT (€) *</label>
          <input type="number" step="0.01" min="0" value={montantHT} onChange={(e) => setMontantHT(e.target.value)} required placeholder="0,00" className={inputClass} />
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

        {/* Octroi de mer — DOM uniquement */}
        {showOctroi && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold text-xs uppercase tracking-wide">Octroi de mer</span>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Taxe DOM</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              Taxe sur les marchandises importées dans votre département. Visible sur votre bon de livraison ou facture fournisseur.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Montant Octroi de mer (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montantOctroiDeMer}
                onChange={(e) => setMontantOctroiDeMer(e.target.value)}
                placeholder="0,00 (optionnel)"
                className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
          </div>
        )}

        {/* Récap */}
        {montantHT && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Montant HT</span>
              <span>{parseFloat(montantHT).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({tauxTVA}%)</span>
              <span>{montantTVA.toFixed(2)} €</span>
            </div>
            {showOctroi && montantOctroiDeMer && (
              <div className="flex justify-between text-orange-600">
                <span>Octroi de mer</span>
                <span>{parseFloat(montantOctroiDeMer).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#0d1b3e] border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Total TTC</span>
              <span>{montantTTC.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
          {loading ? "Enregistrement..." : "Enregistrer la dépense"}
        </button>
      </form>
    </main>
  );
}
