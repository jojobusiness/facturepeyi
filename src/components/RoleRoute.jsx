import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth"; // doit renvoyer une string ("admin", "comptable", etc.)

export default function RoleRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchUserRole()
      .then((r) => {
        setRole(r);
        setChecking(false);
      })
      .catch(() => {
        setRole(null);
        setChecking(false);
      });
  }, []);

  if (checking) return <p>Chargement...</p>;

  // 🔐 Sécurité renforcée ici
  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}