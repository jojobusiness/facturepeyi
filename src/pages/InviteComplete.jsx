import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
} from "firebase/firestore";

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

      // 1. Vérifier que l’invitation existe AVANT de créer le compte Firebase
      const invitationQuery = query(
        collection(db, "utilisateurs"),
        where("email", "==", email),
        where("entrepriseId", "==", entrepriseId)
      );
      const invRes = await getDocs(invitationQuery);
      if (invRes.empty) {
        alert("❌ Invitation introuvable ou expirée. Contactez votre administrateur.");
        return;
      }
      const invitedDoc = invRes.docs[0];
      const invitationData = invitedDoc.data();

      // 2. Vérifier si l’email est déjà utilisé
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        alert("❌ Cet email est déjà utilisé. Veuillez vous connecter.");
        navigate("/");
        return;
      }

      // 3. Créer le compte Firebase (invitation validée)
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 🎯 Enregistrement du user avec le bon UID
      const utilisateurData = {
        email,
        nom,
        role: invitationData.role || "employe",
        entrepriseId,
        createdAt: new Date(),
        accepted: true,
        uid: user.uid,
      };

      await setDoc(doc(db, "utilisateurs", user.uid), utilisateurData);

      // ✅ Ajouter dans la sous-collection /entreprises/{id}/membres
      await setDoc(
        doc(db, "entreprises", entrepriseId, "membres", user.uid),
        {
          uid: user.uid,
          nom,
          email,
          role: utilisateurData.role,
          dateAjout: new Date(),
          entrepriseId,
        }
      );

      // 🧹 Supprimer l'ancien doc temporaire
      await deleteDoc(invitedDoc.ref);

      alert("🎉 Compte finalisé !");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erreur :", err);
      alert("❌ Une erreur est survenue. Vérifiez que vous utilisez bien le bon lien.");
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
        <h2 className="text-xl font-bold text-center text-[#1B5E20]">
          Finaliser l'inscription
        </h2>
        <p className="text-sm text-center">
          Pour : <strong>{email}</strong>
        </p>

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