import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const fetchUserRole = async (uid) => {
  const docRef = doc(db, "entreprises", uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) throw new Error("Données entreprise non trouvées");

  const data = snap.data();
  return data.role || "employe"; // défaut si pas de rôle
};
