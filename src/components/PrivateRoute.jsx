import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function PrivateRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const r = await fetchUserRole();
        console.log("🎯 Rôle récupéré:", r); // <- Debug ici
        setRole(r || "employe");
      } catch (err) {
        console.error("❌ Erreur fetchUserRole:", err);
      } finally {
        setChecking(false);
      }
    };

    loadRole();
  }, []);

  if (checking) return <p className="p-4">Chargement du dashboard...</p>;

  if (!allowedRoles || !Array.isArray(allowedRoles)) return children;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}