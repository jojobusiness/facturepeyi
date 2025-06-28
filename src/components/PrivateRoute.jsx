//import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // const { user, loading } = useAuth();
  const user = true;
  const loading = false;

  if (loading) return <p>Chargement...</p>;
  return user ? children : <Navigate to="/login" />;
}
