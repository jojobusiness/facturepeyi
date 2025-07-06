import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Récupère le rôle de l'utilisateur connecté depuis la collection "entreprises"
 */
export async function fetchUserRole() {
  const user = auth.currentUser;

  if (!user) return null;

  try {
    const docRef = doc(db, "entreprises", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().role || "employe"; // Valeur par défaut si le rôle n'est pas défini
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle :", error);
    return null;
  }
}