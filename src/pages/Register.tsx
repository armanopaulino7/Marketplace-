import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Mail, Lock, AlertCircle, Loader2, User, UserPlus, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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

  useEffect(() => {
    checkAdminExistence();
  }, []);

  const checkAdminExistence = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'adm');

      if (error) throw error;
      setAdminExists(count ? count > 0 : false);
    } catch (err) {
      console.error('Error checking admin:', err);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (role === 'produtor' && !phone) {
        throw new Error('O número de telefone é obrigatório para produtores.');
      }

      // 1. Sign up user with metadata
      // The profile will be created automatically by a database trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            phone,
            phone2,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário.');

      // 3. Success!
      // If email confirmation is required, the user might not be logged in yet.
      // We'll show a success message or redirect.
      if (authData.session) {
        if (redirectPath) {
          navigate(decodeURIComponent(redirectPath), { replace: true });
        } else {
          navigate(`/dashboard/${role}`);
        }
      } else {
        alert('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar a conta (se a confirmação estiver ativada).');
        if (redirectPath) {
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        } else {
          navigate('/login');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400">
          Escolha seu perfil e comece agora mesmo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-4 shadow-xl shadow-stone-200 dark:shadow-none sm:rounded-3xl sm:px-10 border border-stone-100 dark:border-stone-800">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm">
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
                  autoComplete="new-password"
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
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Telefone {role === 'produtor' && '*'}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required={role === 'produtor'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-white bg-white dark:bg-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="9XXXXXXXX"
              />
            </div>

            <div>
              <label htmlFor="phone2" className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Telefone Secundário (Opcional)
              </label>
              <input
                id="phone2"
                name="phone2"
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="block w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-white bg-white dark:bg-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="9XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-1 gap-3">
                {!adminExists && (
                  <button
                    type="button"
                    onClick={() => setRole('adm')}
                    className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                      role === 'adm'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    }`}
                  >
                    <ShieldCheck className={`h-6 w-6 ${role === 'adm' ? 'text-indigo-600' : 'text-stone-400'}`} />
                    <div className="text-left">
                      <div className={`font-bold text-sm ${role === 'adm' ? 'text-indigo-900 dark:text-indigo-400' : 'text-stone-900 dark:text-white'}`}>Administrador</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400">Acesso total ao sistema</div>
                    </div>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setRole('produtor')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'produtor'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <ShoppingBag className={`h-6 w-6 ${role === 'produtor' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'produtor' ? 'text-indigo-900 dark:text-indigo-400' : 'text-stone-900 dark:text-white'}`}>Produtor</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">Crie e venda seus produtos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('afiliado')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'afiliado'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <UserPlus className={`h-6 w-6 ${role === 'afiliado' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'afiliado' ? 'text-indigo-900 dark:text-indigo-400' : 'text-stone-900 dark:text-white'}`}>Afiliado</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">Promova produtos e ganhe comissão</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('cliente')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'cliente'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-600'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <User className={`h-6 w-6 ${role === 'cliente' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'cliente' ? 'text-indigo-900 dark:text-indigo-400' : 'text-stone-900 dark:text-white'}`}>Cliente</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">Compre e acesse seus conteúdos</div>
                  </div>
                </button>
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
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Já tem uma conta?{' '}
              <Link to={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login"} className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
