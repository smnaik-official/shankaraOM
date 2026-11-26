import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import Reports from './components/Reports';
import ClientList from './components/ClientList';
import Expenses from './components/Expenses';
import Subscriptions from './components/Subscriptions';
import Employees from './components/Employees';
import ClientProfitability from './components/ClientProfitability';
import ComplianceCalendar from './components/ComplianceCalendar';
import AdLedger from './components/AdLedger';
import ProfileSettings from './components/ProfileSettings';
import ProposalsList from './components/ProposalsList';
import { Quotations } from './components/Quotations';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { initializeCloudSync } from './services/api';

function App() {
  useEffect(() => {
    initializeCloudSync();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard & Operations Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="prospects" element={<ProposalsList />} />
            <Route path="proposals" element={<Navigate to="/prospects" replace />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="employees" element={<Employees />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="compliance" element={<ComplianceCalendar />} />
            <Route path="compliance-calendar" element={<ComplianceCalendar />} />
            <Route path="client-profitability" element={<ClientProfitability />} />
            <Route path="profitability" element={<Navigate to="/client-profitability" replace />} />
            <Route path="ad-ledger" element={<AdLedger />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Route>
        </Route>

        {/* Fallback to Dashboard (which redirects to Login if unauthenticated) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
