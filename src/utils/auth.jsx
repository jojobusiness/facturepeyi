import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function fetchUserRole(uid) {
  const snap = await getDoc(doc(db, "entreprises", uid));
  if (snap.exists()) {
    return snap.data().role || "employe";
  }
  return "employe";
}
