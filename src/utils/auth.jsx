import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export const fetchUserRole = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const docRef = doc(db, "entreprises", user.uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) throw new Error("Données entreprise non trouvées");

  const data = snap.data();
  return data.role || "employe"; // valeur par défaut
};