import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';

import Layout from "../components/Layout";
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import Clients from './pages/Clients';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Chargement...</p>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/facture/nouvelle" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
        <Route path="/factures" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
