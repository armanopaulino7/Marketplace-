import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, Component, ReactNode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProducerDashboard from './pages/dashboards/ProducerDashboard';
import AffiliateDashboard from './pages/dashboards/AffiliateDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Marketplace from './pages/Marketplace';

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

function NetworkError() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl shadow-xl p-8 border border-rose-100 dark:border-rose-900/30 text-center">
        <div className="bg-rose-50 dark:bg-rose-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Erro de Conexão</h1>
        <p className="text-stone-600 dark:text-stone-400 mb-6">
          Não foi possível conectar ao servidor. Isso pode ser devido a uma conexão lenta ou as chaves do Supabase estarem incorretas.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          <RefreshCw className="h-5 w-5" />
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-stone-900 mb-4">Ops! Algo deu errado.</h1>
            <p className="text-stone-600 mb-6">Ocorreu um erro inesperado. Por favor, tente recarregar a página.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [hasNetworkError, setHasNetworkError] = useState(false);

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message === 'Failed to fetch' || event.reason?.name === 'TypeError' && event.reason?.message.includes('fetch')) {
        setHasNetworkError(true);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (!isSupabaseConfigured) {
    return <ConfigWarning />;
  }

  if (hasNetworkError) {
    return <NetworkError />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Marketplace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/checkout" element={<Checkout />} />
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

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
