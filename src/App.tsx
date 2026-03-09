import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertTriangle } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProducerDashboard from './pages/dashboards/ProducerDashboard';
import AffiliateDashboard from './pages/dashboards/AffiliateDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';

function ConfigWarning() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-amber-100 text-center">
        <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Configuração Necessária</h1>
        <p className="text-stone-600 mb-6">
          Para que o marketplace funcione, você precisa configurar as chaves do Supabase no painel de <strong>Secrets</strong> (Configurações).
        </p>
        <div className="space-y-3 text-left bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Variáveis Necessárias:</p>
          <code className="block text-sm text-indigo-600 font-mono">VITE_SUPABASE_URL</code>
          <code className="block text-sm text-indigo-600 font-mono">VITE_SUPABASE_ANON_KEY</code>
        </div>
        <p className="text-sm text-stone-500">
          Após adicionar as chaves, o aplicativo carregará automaticamente.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigWarning />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard/adm" element={
            <ProtectedRoute allowedRoles={['adm']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/produtor" element={
            <ProtectedRoute allowedRoles={['produtor']}>
              <ProducerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/afiliado" element={
            <ProtectedRoute allowedRoles={['afiliado']}>
              <AffiliateDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/cliente" element={
            <ProtectedRoute allowedRoles={['cliente']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
