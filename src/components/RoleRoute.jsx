import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const userRole = await fetchUserRole();
        setRole(userRole);
      } catch (err) {
        console.error("Erreur rôle utilisateur :", err);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  if (checking) return <p className="p-4">Chargement des autorisations...</p>;

  // Si allowedRoles est vide ou non défini, bloquer par sécurité
  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}