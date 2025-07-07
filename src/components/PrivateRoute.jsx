import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function PrivateRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchUserRole().then((r) => {
      setRole(r || "employe");
      setChecking(false);
    }).catch(() => {
      setChecking(false);
    });
  }, []);

  if (checking) return <p className="p-4">Chargement...</p>;

  // Si aucun filtre de rôle → accès autorisé
  if (!allowedRoles || !Array.isArray(allowedRoles)) return children;

  // Si filtre de rôles → on vérifie
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}