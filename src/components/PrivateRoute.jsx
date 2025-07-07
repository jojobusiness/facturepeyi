import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchUserRole().then((r) => {
      setRole(r || "employe"); // valeur par défaut
      setChecking(false);
    });
  }, []);

  if (checking) return <p>Chargement...</p>;

  // Si aucun rôle n'est requis, on laisse passer tout le monde
  if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to="/unauthorized" />;
}