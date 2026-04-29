import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query } from "firebase/firestore";
import { SketchPicker } from "react-color";
import { useAuth } from "../context/AuthContext";

export default function Categories() {
  const { entrepriseId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ nom: "", couleur: "#059669" });
  const [showPicker, setShowPicker] = useState(false);

  const fetchCategories = async () => {
    if (!entrepriseId) return;
    const snap = await getDocs(query(collection(db, "entreprises", entrepriseId, "categories")));
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (entrepriseId) fetchCategories();
  }, [entrepriseId]);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.nom.trim()) return alert("Nom requis.");
    if (!entrepriseId) return;
    await addDoc(collection(db, "entreprises", entrepriseId, "categories"), {
      ...newCategory,
      entrepriseId,
    });
    setNewCategory({ nom: "", couleur: "#059669" });
    setShowPicker(false);
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "categories", id));
    fetchCategories();
  };

  return (
    <main className="max-w-2xl">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Catégories de dépenses</h2>

      <form onSubmit={addCategory} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0d1b3e]">Nouvelle catégorie</h3>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Nom *</label>
          <input
            type="text"
            value={newCategory.nom}
            onChange={(e) => setNewCategory({ ...newCategory, nom: e.target.value })}
            placeholder="Ex : Fournitures bureau"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">Couleur</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-sm"
              style={{ backgroundColor: newCategory.couleur }}
            />
            <span className="text-sm text-gray-500">{newCategory.couleur}</span>
          </div>
          {showPicker && (
            <div className="mt-3">
              <SketchPicker
                color={newCategory.couleur}
                onChangeComplete={(color) => setNewCategory({ ...newCategory, couleur: color.hex })}
              />
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition">
          Ajouter la catégorie
        </button>
      </form>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune catégorie créée</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.couleur }}
                  />
                  <span className="text-sm font-medium text-[#0d1b3e]">{cat.nom}</span>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
