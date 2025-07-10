import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, updateDoc, getDocs } from "firebase/firestore";

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

      // 🔐 Créer le compte utilisateur Firebase
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 🔎 Récupérer le document temporaire de l'invitation (par email + entreprise)
      const invitationRef = doc(db, "utilisateurs", user.uid); // tentative directe
      const invitationSnap = await getDoc(invitationRef);

      // 🔁 Si pas trouvé, chercher par email (ancienne méthode d'invitation)
      let invitationData = null;
      if (!invitationSnap.exists()) {
        // fallback : chercher l'invitation par email + entrepriseId
        const querySnapshot = await getDoc(doc(db, "entreprises", entrepriseId));
        if (!querySnapshot.exists()) throw new Error("Entreprise introuvable");

        // requery utilisateurs par email et entrepriseId
        const res = await getDocs(
          query(collection(db, "utilisateurs"),
          where("email", "==", email),
          where("entrepriseId", "==", entrepriseId))
        );
        if (res.empty) throw new Error("Invitation introuvable");

        const invitedDoc = res.docs[0];
        invitationData = invitedDoc.data();

        // 💾 Mettre à jour l'entrée avec le bon UID Firebase
        await setDoc(doc(db, "utilisateurs", user.uid), {
          ...invitationData,
          nom,
          accepted: true,
          uid: user.uid,
        });

        // Optionnel : supprimer l'ancien doc temporaire
        await deleteDoc(invitedDoc.ref);
      } else {
        invitationData = invitationSnap.data();
        await setDoc(invitationRef, {
          ...invitationData,
          nom,
          accepted: true,
          uid: user.uid,
        }, { merge: true });
      }

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