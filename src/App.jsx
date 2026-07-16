import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import TerritoirePage from './pages/TerritoirePage';
import FacturationElectronique2026 from './pages/FacturationElectronique2026';
import PixelTracker from './components/PixelTracker';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Conditions from './pages/Conditions';
import CGV from './pages/CGV';
import Confidentialite from './pages/Confidentialite';
import Cookies from './pages/Cookies';
import Forfaits from './pages/Forfaits';
import Inscription from './pages/Inscription';
import PaiementSuccess from './pages/PaiementSuccess';
import PaiementCancel from './pages/PaiementCancel';
import Remboursement from './pages/remboursement';
import InviteComplete from './pages/InviteComplete';
import Unauthorized from './pages/Unauthorized';
import Support from './pages/Support';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import SysAdmin from './pages/SysAdmin';

// Layout sidebar pour le dashboard
import DashboardLayout from './layouts/DashboardLayout';

// Pages dashboard (chaque composant peut être détaillé dans son propre fichier)
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import EditInvoice from './pages/EditInvoice';
import FacturesClient from './pages/FacturesClient';
import Clients from './pages/Clients';
import AddClient from './pages/AddClient';
import EditClient from './pages/EditClient';
import ClientDetails from './pages/ClientDetails';
import DepenseList from './pages/DepenseList';
import DepenseForm from './pages/DepenseForm';
import ImportDepenses from './pages/ImportDepenses';
import ImportFactures from './pages/ImportFactures';
import ImportDevis from './pages/ImportDevis';
import ImportDocuments from './pages/ImportDocuments';
import Categories from './pages/Categories';
import DeclarationFiscale from './pages/DeclarationFiscale';
import Settings from './pages/Settings';
import PlanComptable from './pages/PlanComptable';
import BilanComptable from './pages/BilanComptable';
import JournalComptable from './pages/JournalComptable';
import AdminUserManagement from './pages/AdminUserManagement';
import Rapports from './pages/Rapports';
import DevisList from './pages/DevisList';
import CreateDevis from './pages/CreateDevis';
import EditDevis from './pages/EditDevis';
import CalendrierFiscal from './pages/CalendrierFiscal';
import ImportBancaire from './pages/ImportBancaire';
import Parrainage from './pages/Parrainage';
import PrescriptionCabinet from './pages/PrescriptionCabinet';
import Cabinet from './pages/Cabinet';
import AddClientEntreprise from './pages/AddClientEntreprise';
import RecurrenceList from './pages/RecurrenceList';
import CreateRecurrence from './pages/CreateRecurrence';
import PortailClient from './pages/PortailClient';
import CreateAcompte from './pages/CreateAcompte';
import CreateSolde from './pages/CreateSolde';
import MonAbonnement from './pages/MonAbonnement';

export default function App() {
  return (
    <>
      <PixelTracker />
      <Routes>
      <Route path="/" element={<Home />} />

      {/* Landing dédiée pub froide Meta + actif SEO (réforme 2026 + DOM-TOM) */}
      <Route path="/facturation-electronique-2026" element={<FacturationElectronique2026 />} />
      <Route path="/essai-gratuit" element={<FacturationElectronique2026 />} />

      {/* Pages SEO par territoire DOM-TOM */}
      <Route path="/martinique" element={<TerritoirePage />} />
      <Route path="/guadeloupe" element={<TerritoirePage />} />
      <Route path="/guyane" element={<TerritoirePage />} />
      <Route path="/reunion" element={<TerritoirePage />} />
      <Route path="/mayotte" element={<TerritoirePage />} />
      <Route path="/nouvelle-caledonie" element={<TerritoirePage />} />
      <Route path="/polynesie-francaise" element={<TerritoirePage />} />
      <Route path="/saint-martin" element={<TerritoirePage />} />
      <Route path="/saint-barthelemy" element={<TerritoirePage />} />
      <Route path="/saint-pierre-et-miquelon" element={<TerritoirePage />} />
      <Route path="/wallis-et-futuna" element={<TerritoirePage />} />

      <Route path="/login" element={<Login />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/Inscription" element={<Inscription />} />
      <Route path="/Forfaits" element={<Forfaits />} />
      <Route path="/remboursement" element={<Remboursement />} />
      <Route path="/paiement/success" element={<PaiementSuccess />} />
      <Route path="/paiement/cancel" element={<PaiementCancel />} />
      <Route path="/conditions" element={<Conditions />} />
      <Route path="/cgv" element={<CGV />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/invite-complete" element={<InviteComplete />} />
      <Route path="/support" element={<Support />} />
      <Route path="/portail/:token" element={<PortailClient />} />

      {/* Super-admin (au-dessus de toutes les entreprises) */}
      <Route path="/sysadmin" element={<SuperAdminRoute><SysAdmin /></SuperAdminRoute>} />

      {/* Dashboard imbriqué dans PrivateRoute */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="factures" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
        <Route path="facture/nouvelle" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
        <Route path="facture/modifier/:id" element={<PrivateRoute><EditInvoice /></PrivateRoute>} />
        <Route path="factures/client/:clientId" element={<PrivateRoute><FacturesClient /></PrivateRoute>} />
        <Route path="factures/import" element={<PrivateRoute><ImportFactures /></PrivateRoute>} />
        <Route path="import-documents" element={<PrivateRoute><ImportDocuments /></PrivateRoute>} />
        <Route path="devis" element={<PrivateRoute><DevisList /></PrivateRoute>} />
        <Route path="devis/nouveau" element={<PrivateRoute><CreateDevis /></PrivateRoute>} />
        <Route path="devis/import" element={<PrivateRoute><ImportDevis /></PrivateRoute>} />
        <Route path="devis/modifier/:id" element={<PrivateRoute><EditDevis /></PrivateRoute>} />
        <Route path="clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="clients/ajouter" element={<PrivateRoute><AddClient /></PrivateRoute>} />
        <Route path="clients/modifier/:id" element={<PrivateRoute><EditClient /></PrivateRoute>} />
        <Route path="client/:id" element={<PrivateRoute><ClientDetails /></PrivateRoute>} />
        <Route path="depenses" element={<PrivateRoute><DepenseList /></PrivateRoute>} />
        <Route path="depenses/nouvelle" element={<PrivateRoute><DepenseForm /></PrivateRoute>} />
        <Route path="depenses/modifier/:id" element={<PrivateRoute><DepenseForm /></PrivateRoute>} />
        <Route path="depenses/import" element={<PrivateRoute><ImportDepenses /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
        <Route path="rapports" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <Rapports />
          </RoleRoute>
        } />
        <Route path="plancomptable" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <PlanComptable />
          </RoleRoute>
        } />
        <Route path="bilancomptable" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <BilanComptable />
          </RoleRoute>
        } />
        <Route path="journalcomptable" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <JournalComptable />
          </RoleRoute>
        } />
        <Route path="declarationfiscale" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <DeclarationFiscale />
          </RoleRoute>
        } />
        <Route path="calendrierfiscal" element={
          <RoleRoute allowedRoles={["comptable", "admin"]}>
            <CalendrierFiscal />
          </RoleRoute>
        } />
        <Route path="admin" element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminUserManagement />
          </RoleRoute>
        } />
        <Route path="factures/recurrentes" element={<PrivateRoute><RecurrenceList /></PrivateRoute>} />
        <Route path="factures/recurrentes/nouvelle" element={<PrivateRoute><CreateRecurrence /></PrivateRoute>} />
        <Route path="facture/acompte/nouvelle" element={<PrivateRoute><CreateAcompte /></PrivateRoute>} />
        <Route path="facture/solde/:acompteId" element={<PrivateRoute><CreateSolde /></PrivateRoute>} />
        <Route path="parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="mon-abonnement" element={<PrivateRoute><MonAbonnement /></PrivateRoute>} />
        <Route path="import-bancaire" element={<PrivateRoute><ImportBancaire /></PrivateRoute>} />
        <Route path="parrainage" element={<PrivateRoute><Parrainage /></PrivateRoute>} />
        <Route path="prescription" element={<PrivateRoute><PrescriptionCabinet /></PrivateRoute>} />
        <Route path="cabinet" element={<PrivateRoute><Cabinet /></PrivateRoute>} />
        <Route path="cabinet/ajouter" element={<PrivateRoute><AddClientEntreprise /></PrivateRoute>} />
      </Route>

      {/* Redirection inconnue */}
      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}