import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export default function DepenseForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
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

  const [entrepriseId, setEntrepriseId] = useState(null);

  // 🔍 Récupération de l'ID de l'entreprise
  useEffect(() => {
    const fetchEntrepriseId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "utilisateurs", user.uid));
      if (userDoc.exists()) {
        setEntrepriseId(userDoc.data().entrepriseId);
      }
    };
    fetchEntrepriseId();
  }, []);

  // 📂 Récupération des catégories personnalisées de l’entreprise
  useEffect(() => {
    if (!entrepriseId) return;
    const fetchCategories = async () => {
      const q = query(
        collection(db, "entreprises", entrepriseId, "categories")
      );
      const snap = await getDocs(q);
      setCategories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, [entrepriseId]);

  // 💸 Calcul TVA & TTC
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !entrepriseId) return alert("Utilisateur non connecté");

    try {
      await addDoc(
        collection(db, "entreprises", entrepriseId, "depenses"),
        {
          ...formData,
          montantHT: parseFloat(montantHT),
          tauxTVA: parseFloat(tauxTVA),
          montantTVA: parseFloat(montantTVA.toFixed(2)),
          montantTTC: parseFloat(montantTTC.toFixed(2)),
          date: Timestamp.fromDate(new Date(formData.date)),
          createdAt: Timestamp.now(),
          entrepriseId,
        }
      );

      alert("✅ Dépense enregistrée !");
      navigate("/depenses");
    } catch (err) {
      alert("❌ Erreur lors de l'enregistrement.");
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

        <div className="text-sm text-gray-700">
          <p>
            TVA à payer : <strong>{montantTVA.toFixed(2)} €</strong>
          </p>
          <p>
            Montant TTC : <strong>{montantTTC.toFixed(2)} €</strong>
          </p>
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