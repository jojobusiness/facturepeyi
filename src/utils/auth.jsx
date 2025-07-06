import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const fetchUserRole = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "entreprises", user.uid));
  return snap.exists() ? snap.data().role : null;
};
