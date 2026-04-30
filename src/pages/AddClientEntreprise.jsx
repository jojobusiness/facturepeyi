import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { TERRITORIES, REGIMES, getTvaRate, getMentionLegale } from "../lib/territories";
import { FaArrowLeft } from "react-icons/fa";

export default function AddClientEntreprise() {
  const navigate = useNavigate();
  const { user, isCabinet, refreshManagedEntreprises, switchEntreprise } = useAuth();

  const [nom, setNom] = useState("");
  const [territoire, setTerritoire] = useState("martinique");
  const [regime, setRegime] = useState("micro-bic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tvaRate      = getTvaRate(territoire, regime);
  const mentionLegale = getMentionLegale(territoire, regime);
  const octroiDeMer  = TERRITORIES[territoire]?.octroiDeMer ?? false;

  if (!isCabinet) {
    navigate("/dashboard/cabinet");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return setError("Le nom de l'entreprise est requis.");
    if (!user) return setError("Utilisateur non connecté.");
    setLoading(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "entreprises"), {
        nom: nom.trim(),
        ownerUid: user.uid,
        cabinetUid: user.uid,
        territoire,
        tvaRate,
        mentionLegale,
        regime,
        octroiDeMer,
        plan: "decouverte",
        planStatus: "active",
        createdAt: serverTimestamp(),
      });

      await refreshManagedEntreprises();
      await switchEntreprise(ref.id);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto">
      <button
        onClick={() => navigate("/dashboard/cabinet")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-6"
      >
        <FaArrowLeft className="w-3 h-3" /> Retour au cabinet
      </button>

      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Ajouter un client</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

        {/* Nom */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Nom de l'entreprise cliente *</label>
          <input
            type="text"
            required
            placeholder="SARL Dupont, SCI Caraïbes..."
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Territoire */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Territoire d'activité</label>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {Object.entries(TERRITORIES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTerritoire(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition ${
                  territoire === key
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <span className="text-lg flex-shrink-0">{t.flag}</span>
                <span className="text-xs leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Régime */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Régime fiscal</label>
          <div className="space-y-2">
            {Object.entries(REGIMES).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                  regime === key ? "border-emerald-600 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="regime"
                  value={key}
                  checked={regime === key}
                  onChange={() => setRegime(key)}
                  className="accent-emerald-600"
                />
                <span className={`text-sm ${regime === key ? "font-semibold text-emerald-800" : "text-gray-700"}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Aperçu TVA */}
        <div className={`rounded-xl px-4 py-3 text-sm ${tvaRate === 0 ? "bg-blue-50 border border-blue-100 text-blue-800" : "bg-emerald-50 border border-emerald-100 text-emerald-800"}`}>
          <div className="font-semibold mb-0.5">
            TVA sur les factures : <span className="text-base">{tvaRate}%</span>
            {octroiDeMer && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Octroi de mer</span>}
          </div>
          {mentionLegale && <div className="text-xs opacity-75 mt-1 italic">"{mentionLegale}"</div>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
        >
          {loading ? "Création en cours..." : "Créer et accéder au compte client"}
        </button>
      </form>
    </main>
  );
}
