import { useAuth } from '.../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Chargement...</p>;
  return user ? children : <Navigate to="/login" />;
}