import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const fetchUserRole = async (uid) => {
  const docRef = doc(db, "utilisateurs", uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) throw new Error("Utilisateur non trouvé");

  const data = snap.data();
  return data.role || "employe"; // Rôle par défaut si manquant
};

return {
  role: data.role || "employe",
  entrepriseId: data.entrepriseId,
};