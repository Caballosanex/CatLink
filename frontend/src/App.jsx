import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import './App.css';

function AuthGuard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={
        user
          ? <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />
          : <LoginPage />
      } />
      <Route path="/customer/*" element={
        <AuthGuard role="customer"><CustomerLayout /></AuthGuard>
      } />
      <Route path="/admin/*" element={
        <AuthGuard role="admin"><AdminLayout /></AuthGuard>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
