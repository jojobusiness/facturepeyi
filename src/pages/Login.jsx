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
  addDoc,
  getDoc,
} from "firebase/firestore";
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("employe"); // employe / comptable / admin
  const [isNew, setIsNew] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isNew) {
        // ✅ Création du compte
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        let entrepriseId = null;

        if (role === "admin") {
          // ✅ Créer une entreprise liée à cet admin
          const entrepriseRef = await addDoc(collection(db, "entreprises"), {
            nom: nom || "Entreprise sans nom",
            ownerUid: user.uid,
            createdAt: new Date(),
          });
          entrepriseId = entrepriseRef.id;
        }

        // ✅ Création du document utilisateur
        await setDoc(doc(db, "utilisateurs", user.uid), {
          email,
          nom,
          role,
          createdAt: new Date(),
          entrepriseId: entrepriseId,
        });

        alert("✅ Compte créé !");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("🔓 Connexion réussie !");
      }

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("❌ Erreur : " + err.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center text-[#1B5E20]">
          {isNew ? "Créer un compte" : "Connexion"}
        </h2>

        {isNew && (
          <>
            <input
              type="text"
              placeholder="Nom complet"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="employe">Employé</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
          </>
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
          {isNew ? "S’inscrire" : "Se connecter"}
        </button>

        <p
          onClick={() => setIsNew(!isNew)}
          className="text-sm text-blue-600 text-center cursor-pointer"
        >
          {isNew
            ? "Déjà inscrit ? Se connecter"
            : "Pas encore de compte ? S’inscrire"}
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-gray-600 underline w-full text-center mt-2"
        >
          ← Revenir à l’accueil
        </button>
      </form>
    </main>
  );
}