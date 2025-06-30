import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EditInvoice from './pages/EditInvoice';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import EditClient from './pages/EditClient';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/facture/nouvelle" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
      <Route path="/factures" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
      <Route path="/facture/modifier/:id" element={<PrivateRoute><EditInvoice /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/clients/ajouter" element={<PrivateRoute><AddClient /></PrivateRoute>} />
      <Route path="/clients/modifier/:id" element={<PrivateRoute><EditClient /></PrivateRoute>} />
      <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}