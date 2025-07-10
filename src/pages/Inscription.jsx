import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";

export default function Inscription() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 Créer le compte utilisateur dans Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 🏢 Créer une nouvelle entreprise liée à cet utilisateur (admin)
      const entrepriseRef = await addDoc(collection(db, "entreprises"), {
        nom: nom || "Entreprise sans nom",
        ownerUid: user.uid,
        createdAt: new Date(),
      });

      const entrepriseId = entrepriseRef.id;

      // 👤 Créer l'utilisateur dans la collection "utilisateurs"
      await setDoc(doc(db, "utilisateurs", user.uid), {
        uid: user.uid,
        email,
        nom,
        role: "admin",
        entrepriseId,
        createdAt: new Date(),
      });

      // ➕ Ajouter l'utilisateur dans la sous-collection "membres" de l'entreprise
      await setDoc(doc(db, "entreprises", entrepriseId, "membres", user.uid), {
        uid: user.uid,
        email,
        nom,
        role: "admin",
        dateAjout: new Date(),
      });

      alert("✅ Compte administrateur créé !");
      navigate("/dashboard");

    } catch (err) {
      console.error("Erreur inscription :", err);
      if (err.code === "auth/email-already-in-use") {
        alert("⚠️ Cet email est déjà utilisé.");
      } else {
        alert("❌ Erreur : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center text-[#1B5E20]">
          Créer un compte administrateur
        </h2>

        <input
          type="text"
          placeholder="Nom complet"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#1B5E20] text-white w-full p-2 rounded hover:bg-[#2e7d32]"
        >
          {loading ? "Création en cours..." : "S’inscrire"}
        </button>
      </form>
    </main>
  );
}