/**
 * Main App Component
 * Sets up routing and context providers
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { DataProvider } from '@/contexts/DataContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import TypesPrestations from '@/pages/TypesPrestations';
import Prestations from '@/pages/Prestations';
import Paiements from '@/pages/Paiements';
import Settings from '@/pages/Settings';
import { ROUTES } from '@/constants';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <ConfigProvider>
              <DataProvider>
                <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.LOGIN} element={<Login />} />

            {/* Protected Routes */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.CLIENTS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.TYPES_PRESTATION}
              element={
                <ProtectedRoute>
                  <Layout>
                    <TypesPrestations />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.PRESTATIONS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Prestations />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.PAIEMENTS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Paiements />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.SETTINGS}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

            {/* 404 - Redirect to dashboard */}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Routes>
              </DataProvider>
            </ConfigProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
