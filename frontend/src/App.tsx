import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ActivityLogProvider } from './contexts/ActivityLogContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import QuotationManagement from './pages/QuotationManagement';
import PriceCalculator from './pages/PriceCalculator';
import AccountManagement from './pages/AccountManagement';
import ActivityLog from './pages/ActivityLog';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onMenuClick={() => {}} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 로그인된 사용자의 역할에 따른 기본 페이지 결정
  const getDefaultRoute = () => {
    if (user?.role === 'ADMIN') {
      return '/dashboard';
    } else {
      return '/customers';
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QuotationManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/price-calculator"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <PriceCalculator />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-management"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AccountManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-log"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityLog />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ActivityLogProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ActivityLogProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
