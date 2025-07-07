import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUserRole } from "../utils/auth";
import { auth } from "../lib/firebase";

export default function PrivateRoute({ children, allowedRoles }) {
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⛔ Aucun utilisateur connecté");
        setChecking(false);
        return;
      }

      try {
        const r = await fetchUserRole(user.uid);
        setRole(r || "employe");
      } catch (err) {
        console.error("❌ Erreur récupération du rôle:", err);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) return <p className="p-4">⏳ Chargement du tableau de bord...</p>;

  // Si pas de restrictions de rôles, autoriser l'accès
  if (!allowedRoles || !Array.isArray(allowedRoles)) return children;

  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
}