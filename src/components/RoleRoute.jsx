import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function RoleRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setChecking(false);
        return;
      }

      try {
        const r = await fetchUserRole(user.uid);
        setRole(r || "employe"); // valeur de secours
      } catch (err) {
        console.error("Erreur récupération rôle :", err);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔐 Sécurité maximale : si allowedRoles est undefined, on refuse l’accès
  if (checking) return <p className="p-4">Chargement des autorisations...</p>;
  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}