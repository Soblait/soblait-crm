import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import Opportunities from './pages/Opportunities.jsx';
import ActNow from './pages/ActNow.jsx';
import Calendar from './pages/Calendar.jsx';
import Tasks from './pages/Tasks.jsx';
import Reports from './pages/Reports.jsx';
import Automations from './pages/Automations.jsx';
import Galaxy from './pages/Galaxy.jsx';
import SettingsHub from './pages/Settings/SettingsHub.jsx';
import TeamUsers from './pages/Settings/TeamUsers.jsx';
import AuditLog from './pages/Settings/AuditLog.jsx';
import PipelineStages from './pages/Settings/PipelineStages.jsx';
import SystemTags from './pages/Settings/SystemTags.jsx';
import OnboardingTemplates from './pages/Settings/OnboardingTemplates.jsx';
import Integrations from './pages/Settings/Integrations.jsx';
import EmailTemplates from './pages/Settings/EmailTemplates.jsx';

function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="act-now" element={<ActNow />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="automations" element={<Automations />} />
        <Route path="galaxy" element={<Galaxy />} />
        <Route path="settings" element={<SettingsHub />} />
        <Route path="settings/team" element={<TeamUsers />} />
        <Route path="settings/audit-log" element={<AuditLog />} />
        <Route path="settings/stages" element={<PipelineStages />} />
        <Route path="settings/tags" element={<SystemTags />} />
        <Route path="settings/onboarding-templates" element={<OnboardingTemplates />} />
        <Route path="settings/integrations" element={<Integrations />} />
        <Route path="settings/email-templates" element={<EmailTemplates />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
