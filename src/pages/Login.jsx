import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import './Login.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNew, setIsNew] = useState(false); // toggle inscription / connexion
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
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Compte créé !");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Connecté !");
      }
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow w-full max-w-md space-y-3">
      <h2 className="text-lg font-semibold text-center">{isNew ? "Inscription" : "Connexion"}</h2>
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
      <button type="submit" className="bg-[#1B5E20] text-white w-full p-2 rounded hover:bg-[#2e7d32]">
        {isNew ? "S’inscrire" : "Se connecter"}
      </button>
      <p
        onClick={() => setIsNew(!isNew)}
        className="text-sm text-blue-600 text-center cursor-pointer"
      >
        {isNew ? "Déjà inscrit ? Se connecter" : "Pas encore de compte ? S’inscrire"}
      </p>
    </form>
  );
}