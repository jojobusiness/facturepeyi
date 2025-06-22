import { useState } from "react";
import { auth } from "./lib/firebase";
import { FacebookAuthProvider } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNew, setIsNew] = useState(false); // toggle inscription / connexion
  
  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        alert("Connecté avec Google !");
    } catch (err) {
        alert("Erreur Google : " + err.message);
    }
  };
  const handleFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        alert("Connecté avec Facebook !");
    } catch (err) {
        alert("Erreur Facebook : " + err.message);
    }
  };
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
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isNew ? "Inscription" : "Connexion"}</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">{isNew ? "S'inscrire" : "Se connecter"}</button>
      <button onClick={handleGoogle}>Connexion avec Google</button>
      <button onClick={handleFacebook}>Connexion avec Facebook</button>
      <p onClick={() => setIsNew(!isNew)} style={{ cursor: "pointer", color: "blue" }}>
        {isNew ? "Déjà inscrit ? Se connecter" : "Pas encore de compte ? S'inscrire"}
      </p>
    </form>
  );
}