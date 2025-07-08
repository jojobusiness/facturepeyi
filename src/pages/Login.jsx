import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [isNew, setIsNew] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "utilisateurs", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          navigate("/dashboard");
        } else {
          alert("⚠️ Compte invalide ou non invité.");
          await auth.signOut();
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        // ➕ Création uniquement autorisée pour des admins
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        await setDoc(doc(db, "utilisateurs", user.uid), {
          email,
          nom,
          role: "admin",
          entrepriseId: user.uid,
          createdAt: new Date(),
        });
        alert("Compte administrateur créé !");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "utilisateurs", cred.user.uid));
        if (!userDoc.exists()) {
          alert("⚠️ Aucun compte utilisateur trouvé.");
          return;
        }
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center text-[#1B5E20]">
          {isNew ? "Créer un compte admin" : "Connexion"}
        </h2>

        {isNew && (
          <input
            type="text"
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        )}

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
          className="bg-[#1B5E20] text-white w-full p-2 rounded hover:bg-[#2e7d32]"
        >
          {isNew ? "Créer le compte admin" : "Se connecter"}
        </button>

        <p
          onClick={() => setIsNew(!isNew)}
          className="text-sm text-blue-600 text-center cursor-pointer"
        >
          {isNew ? "← Se connecter" : "Créer un compte admin"}
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 underline w-full text-center mt-2"
        >
          ← Revenir à l’accueil
        </button>
      </form>
    </main>
  );
}