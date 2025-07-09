import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export default function DepenseForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({
    fournisseur: "",
    description: "",
    date: "",
    categorieId: "",
  });

  const [montantHT, setMontantHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState(0); // en %
  const [montantTVA, setMontantTVA] = useState(0);
  const [montantTTC, setMontantTTC] = useState(0);

  // Récupération des catégories personnalisées
  useEffect(() => {
    if (!uid) return;
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), where("uid", "==", uid));
      const snap = await getDocs(q);
      setCategories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, [uid]);

  // Calcul TVA et TTC automatiquement
  useEffect(() => {
    const ht = parseFloat(montantHT);
    const taux = parseFloat(tauxTVA);
    if (!isNaN(ht)) {
      const tva = (ht * taux) / 100;
      setMontantTVA(tva);
      setMontantTTC(ht + tva);
    } else {
      setMontantTVA(0);
      setMontantTTC(0);
    }
  }, [montantHT, tauxTVA]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "depenses"), {
        ...formData,
        uid: auth.currentUser?.uid,
        montantHT: parseFloat(montantHT),
        tauxTVA: parseFloat(tauxTVA),
        montantTVA: parseFloat(montantTVA.toFixed(2)),
        montantTTC: parseFloat(montantTTC.toFixed(2)),
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
      });
      navigate("/depenses");
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la dépense.");
      console.error(err);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ajouter une dépense</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <input
          name="fournisseur"
          onChange={handleChange}
          value={formData.fournisseur}
          required
          placeholder="Fournisseur"
          className="w-full p-2 border rounded"
        />

        <input
          name="description"
          onChange={handleChange}
          value={formData.description}
          required
          placeholder="Description"
          className="w-full p-2 border rounded"
        />

        <input
          type="date"
          name="date"
          onChange={handleChange}
          value={formData.date}
          required
          className="w-full p-2 border rounded"
        />

        {/* Sélection catégorie */}
        <select
          name="categorieId"
          onChange={handleChange}
          value={formData.categorieId}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">-- Choisir une catégorie --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
            </option>
          ))}
        </select>

        {/* Montant HT */}
        <div>
          <label className="block font-medium mb-1">Montant HT (€)</label>
          <input
            type="number"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Taux TVA */}
        <div>
          <label className="block font-medium mb-1">TVA (%)</label>
          <select
            value={tauxTVA}
            onChange={(e) => setTauxTVA(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value={0}>0%</option>
            <option value={2.1}>2.1%</option>
            <option value={5.5}>5.5%</option>
            <option value={8.5}>8.5%</option>
            <option value={10}>10%</option>
            <option value={20}>20%</option>
          </select>
        </div>

        {/* Résumé calculé */}
        <div className="text-sm text-gray-700">
          <p>TVA à payer : <strong>{montantTVA.toFixed(2)} €</strong></p>
          <p>Montant TTC : <strong>{montantTTC.toFixed(2)} €</strong></p>
        </div>

        <button
          type="submit"
          className="bg-[#1B5E20] text-white px-4 py-2 rounded hover:bg-green-700"
        >
          💾 Enregistrer la dépense
        </button>
      </form>

      <button
        onClick={() => navigate("/depenses")}
        className="mt-4 text-blue-600 underline"
      >
        ← Retour à la liste
      </button>
    </main>
  );
}