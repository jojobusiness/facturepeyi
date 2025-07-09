import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const fetchUserRole = async (uid) => {
  // 1. Chercher dans "utilisateurs"
  let snap = await getDoc(doc(db, "utilisateurs", uid));
  if (snap.exists()) {
    const data = snap.data();
    return data.role || "employe";
  }

  // 2. Sinon, chercher dans "entreprises"
  snap = await getDoc(doc(db, "entreprises", uid));
  if (snap.exists()) {
    const data = snap.data();
    return data.role || "admin";
  }

  // 3. Sinon, pas trouvé
  throw new Error("Utilisateur introuvable dans Firestore");
};