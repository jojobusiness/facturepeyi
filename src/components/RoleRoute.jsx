import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function RoleRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  // ✅ Force allowedRoles à un tableau vide si undefined
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setChecking(false);
        return;
      }

      try {
        const r = await fetchUserRole(user.uid);
        setRole(r || "employe");
      } catch (err) {
        console.error("Erreur lors de la récupération du rôle :", err);
        setRole(null);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) return <p className="p-4">Chargement des autorisations...</p>;

  // ✅ Vérification robuste
  if (!roles.includes(role)) {
    console.warn("Accès refusé :", { role, roles });
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}