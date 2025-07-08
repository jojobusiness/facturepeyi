import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUserRole } from "../utils/auth";
import { auth } from "../lib/firebase";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        console.warn("⛔ Aucun utilisateur connecté");
        setUser(null);
        setChecking(false);
        return;
      }

      setUser(currentUser);

      try {
        const r = await fetchUserRole(currentUser.uid);
        setRole(r || "employe");
      } catch (err) {
        console.error("❌ Erreur récupération du rôle :", err);
        setRole(null);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) return <p className="p-4">⏳ Chargement des autorisations...</p>;

  if (!user) return <Navigate to="/login" replace />;

  // ✅ Si aucune restriction de rôles, autoriser tout utilisateur connecté
  if (!allowedRoles.length) return children;

  // ❌ Refus d'accès si rôle non autorisé
  if (!allowedRoles.includes(role)) {
    console.warn("🔒 Accès refusé :", { user: user.email, role, allowedRoles });
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}