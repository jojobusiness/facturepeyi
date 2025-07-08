import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const fetchUserRole = async (uid) => {
  const docRef = doc(db, "utilisateurs", uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) throw new Error("Utilisateur non trouvé");

  const data = snap.data();

  return {
    role: data.role || "employe",           // par défaut
    entrepriseId: data.entrepriseId || null // peut être utile pour filtrer
  };
};
