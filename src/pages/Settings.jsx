import { useState } from "react";

export default function Settings() {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    notifications: true,
    theme: "clair",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Paramètres enregistrés (à connecter à Firestore ou Auth)");
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Paramètres</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md space-y-4">
        <input
          type="text"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          placeholder="Nom"
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="notifications"
            checked={form.notifications}
            onChange={handleChange}
          />
          <label htmlFor="notifications">Recevoir des notifications</label>
        </div>
        <select
          name="theme"
          value={form.theme}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="clair">Thème clair</option>
          <option value="sombre">Thème sombre</option>
        </select>

        <button type="submit" className="bg-[#1B5E20] text-white w-full p-2 rounded">
          Enregistrer
        </button>
      </form>
      <button
      onClick={() => navigate("/dashboard")}
      className="mb-4 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
      ← Retour au tableau de bord
      </button>
    </main>
  );
}