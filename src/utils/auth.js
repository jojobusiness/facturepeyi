import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const fetchUserRole = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const ref = doc(db, "entreprises", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return data.role || null;
};