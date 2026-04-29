import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AddClient() {
  const { entrepriseId } = useAuth();
  const [form, setForm] = useState({ nom: "", email: "", tel: "", adresse: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrepriseId) return alert("Entreprise introuvable.");
    setLoading(true);
    try {
      await addDoc(collection(db, "entreprises", entrepriseId, "clients"), {
        ...form,
        createdAt: serverTimestamp(),
        entrepriseId,
      });
      navigate("/dashboard/clients");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Ajouter un client</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Nom *</label>
          <input
            type="text"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            placeholder="Nom du client ou de l'entreprise"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="client@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Téléphone</label>
          <input
            type="text"
            name="tel"
            value={form.tel}
            onChange={handleChange}
            placeholder="+596 696 00 00 00"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Adresse</label>
          <input
            type="text"
            name="adresse"
            value={form.adresse}
            onChange={handleChange}
            placeholder="Adresse complète"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading ? "Enregistrement..." : "Ajouter le client"}
        </button>
      </form>
    </main>
  );
}
