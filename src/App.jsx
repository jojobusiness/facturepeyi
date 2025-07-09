import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EditInvoice from './pages/EditInvoice';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import FacturesClient from './pages/FacturesClient';
import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import EditClient from './pages/EditClient';
import ClientDetails from './pages/ClientDetails';
import DepenseList from './pages/DepenseList';
import DepenseForm from './pages/DepenseForm';
import ImportDepenses from './pages/ImportDepenses';
import Categories from './pages/Categories';
import DeclarationFiscale from './pages/DeclarationFiscale';
import Settings from './pages/Settings';
import PlanComptable from './pages/PlanComptable';
import BilanComptable from './pages/BilanComptable';
import JournalComptable from './pages/JournalComptable';
import Unauthorized from './pages/Unauthorized';
import AdminUserManagement from './pages/AdminUserManagement';
import InviteComplete from './pages/InviteComplete';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/facture/nouvelle" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
      <Route path="/factures" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
      <Route path="/facture/modifier/:id" element={<PrivateRoute><EditInvoice /></PrivateRoute>} />
      <Route path="/factures/client/:clientId" element={<PrivateRoute><FacturesClient /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/clients/ajouter" element={<PrivateRoute><AddClient /></PrivateRoute>} />
      <Route path="/clients/modifier/:id" element={<PrivateRoute><EditClient /></PrivateRoute>} />
      <Route path="/client/:id" element={<PrivateRoute><ClientDetails /></PrivateRoute>} />
      <Route path="/depenses" element={<PrivateRoute><DepenseList /></PrivateRoute>} />
      <Route path="/depenses/nouvelle" element={<PrivateRoute><DepenseForm /></PrivateRoute>} />
      <Route path="/depenses/import" element={<PrivateRoute><ImportDepenses /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/plancomptable" element={<PrivateRoute><PlanComptable /></PrivateRoute>} />
      <Route path="/bilancomptable" element={<RoleRoute allowedRoles={["comptable", "admin"]}><BilanComptable /></RoleRoute>} />
      <Route path="/journalcomptable" element={<RoleRoute allowedRoles={["comptable", "admin"]}><JournalComptable /></RoleRoute>} />
      <Route path="/declarationfiscale" element={<RoleRoute allowedRoles={["comptable", "admin"]}><DeclarationFiscale /></RoleRoute>} />
      <Route path="/admin" element={<RoleRoute allowedRoles={["admin"]}><AdminUserManagement /></RoleRoute>} />
      <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/invite-complete" element={<InviteComplete />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}