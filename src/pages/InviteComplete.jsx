import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function InviteComplete() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const entrepriseId = searchParams.get("entrepriseId");

  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !entrepriseId) return alert("Lien d’invitation invalide");

    try {
      setLoading(true);

      // Créer le compte utilisateur Firebase
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Lier l'utilisateur à l'entreprise
      const entrepriseRef = doc(db, "entreprises", entrepriseId);
      const entrepriseSnap = await getDoc(entrepriseRef);

      if (!entrepriseSnap.exists()) {
        throw new Error("Entreprise introuvable");
      }

      const userData = {
        email,
        nom,
        role: "employe", // ou "comptable" selon l'invitation
        entrepriseId,
        createdAt: new Date(),
      };

      // Enregistrer l'utilisateur dans la collection `utilisateurs`
      await setDoc(doc(db, "utilisateurs", user.uid), userData);

      // Mettre à jour la liste des utilisateurs dans l’entreprise
      const entrepriseData = entrepriseSnap.data();
      const membres = entrepriseData.membres || [];
      await updateDoc(entrepriseRef, {
        membres: [...membres, user.uid],
      });

      alert("🎉 Compte finalisé !");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erreur :", err);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow p-6 rounded w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-center text-[#1B5E20]">Finaliser l'inscription</h2>
        <p className="text-sm text-center">Pour : <strong>{email}</strong></p>

        <input
          type="text"
          placeholder="Nom complet"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Créer un mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1B5E20] text-white p-2 rounded hover:bg-green-800"
        >
          {loading ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
    </main>
  );
}