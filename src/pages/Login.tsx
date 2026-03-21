import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShoppingBag, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, profile, clearSession } = useAuth();
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect');

  useEffect(() => {
    if (user && profile) {
      if (redirectPath) {
        navigate(decodeURIComponent(redirectPath), { replace: true });
      } else {
        navigate(`/dashboard/${profile.role}`);
      }
    }
  }, [user, profile, navigate, redirectPath]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl shadow-xl p-8 border border-amber-100 dark:border-amber-900/30 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Erro de Configuração</h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            O Supabase não está configurado corretamente no Vercel. Verifique as variáveis de ambiente <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong>.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tentando login...');
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login for:', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        alert('Erro de Autenticação: ' + authError.message);
        throw authError;
      }
      
      console.log('Auth successful, user:', data.user?.id);
      
      // Check if profile exists
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();
        
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile missing, creating default profile...');
        // Lazy create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user?.id,
              email: data.user?.email,
              role: data.user?.user_metadata?.role || 'cliente',
              phone: data.user?.user_metadata?.phone || null,
              phone2: data.user?.user_metadata?.phone2 || null,
            }
          ])
          .select('role')
          .single();

        if (createError) {
          console.error('Failed to create lazy profile:', createError);
          throw new Error('Sua conta existe, mas não conseguimos criar seu perfil automaticamente. Por favor, tente se cadastrar novamente ou contate o suporte.');
        }
        profileData = newProfile;
      } else if (profileError) {
        console.error('Profile fetch error:', profileError);
        alert('Erro ao buscar perfil: ' + profileError.message);
        throw profileError;
      }
      
      console.log('Profile found, role:', profileData.role);
      
      if (redirectPath) {
        navigate(decodeURIComponent(redirectPath), { replace: true });
      } else {
        navigate(`/dashboard/${profileData.role}`, { replace: true });
      }
      
    } catch (err: any) {
      console.error('Login catch block:', err);
      alert('Erro no Login: ' + (err.message || 'Erro desconhecido'));
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Bem-vindo de volta
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400">
          Acesse sua conta para gerenciar seu marketplace
        </p>
        
        {/* Connection Status Indicator */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-stone-900 rounded-full border border-stone-100 dark:border-stone-800 shadow-sm">
            <div className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {isSupabaseConfigured ? 'Sistema Online' : 'Sistema Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-xl shadow-stone-200 dark:shadow-none sm:rounded-3xl sm:px-10 border border-stone-100 dark:border-stone-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-white bg-white dark:bg-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-white bg-white dark:bg-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100 dark:border-stone-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400">Não tem uma conta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to={redirectPath ? `/register?redirect=${encodeURIComponent(redirectPath)}` : "/register"}
                className="w-full flex justify-center py-3.5 px-4 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-sm text-sm font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all"
              >
                Criar nova conta
              </Link>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={clearSession}
                className="text-xs text-stone-400 hover:text-indigo-600 transition-colors underline underline-offset-4"
              >
                Problemas ao entrar? Limpar sessão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
