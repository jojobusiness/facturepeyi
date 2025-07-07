import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserRole } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchUserRole().then((r) => {
      setRole(r);
      setChecking(false);
    });
  }, []);

  if (checking) return <p>Chargement...</p>;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;
  return children;
}