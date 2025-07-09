import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    nom: "",
    email: user?.email || "",
    siret: "",
    logo: "",
    notifications: true,
    theme: "clair",
    role: "",
    tvaActive: true,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "entreprises", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForm((prev) => ({ ...prev, ...docSnap.data() }));
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let logoURL = form.logo;

      if (logoFile) {
        const storageRef = ref(storage, `logos/${user.uid}.png`);
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, "entreprises", user.uid);
      await setDoc(
        docRef,
        {
          ...form,
          role: form.role || "employe",
          logo: logoURL,
          logoUrl: logoURL,
        },
        { merge: true }
      );

      alert("✅ Paramètres enregistrés.");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    await sendPasswordResetEmail(auth, user.email);
    alert("📧 Email de réinitialisation envoyé.");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Supprimer définitivement ton compte ?")) {
      await deleteUser(user);
      alert("✅ Compte supprimé.");
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">⚙️ Paramètres</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow max-w-xl space-y-4"
      >
        <input
          type="text"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          placeholder="Nom de l'entreprise"
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
          disabled
        />
        <input
          type="text"
          name="siret"
          value={form.siret}
          onChange={handleChange}
          placeholder="Numéro SIRET"
          className="w-full p-2 border rounded"
        />

        <div>
          <label className="block font-medium mb-1">Logo entreprise</label>
          {form.logo && (
            <img
              src={form.logo}
              alt="Logo actuel"
              className="h-20 object-contain border mb-2"
            />
          )}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
        </div>

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

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Choisir un rôle --</option>
          <option value="admin">Administrateur</option>
          <option value="comptable">Comptable</option>
          <option value="employe">Employé</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="tvaActive"
            checked={form.tvaActive}
            onChange={handleChange}
          />
          Activer la gestion de la TVA
        </label>

        <button
          type="submit"
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          {loading ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </form>

      <div className="mt-8 bg-white p-4 rounded shadow max-w-xl space-y-4">
        <h3 className="text-xl font-semibold">🔐 Sécurité</h3>
        <p>
          Pour changer votre mot de passe, cliquez ci-dessous pour recevoir un
          lien sécurisé par email.
        </p>
        <button
          onClick={handleResetPassword}
          className="bg-yellow-500 text-white w-full p-2 rounded hover:bg-yellow-600"
        >
          📧 Réinitialiser le mot de passe par email
        </button>
      </div>

      <div className="mt-8 bg-white p-4 rounded shadow max-w-xl space-y-4">
        <h3 className="text-xl font-semibold text-red-600">🗑️ Supprimer le compte</h3>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white w-full p-2 rounded hover:bg-red-700"
        >
          Supprimer mon compte
        </button>
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
      >
        ← Retour au tableau de bord
      </button>
    </main>
  );
}