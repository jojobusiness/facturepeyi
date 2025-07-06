import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function RoleRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole().then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-4">Chargement des autorisations...</p>;

  // ✅ Protection si allowedRoles est manquant
  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}