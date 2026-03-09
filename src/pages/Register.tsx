import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Mail, Lock, AlertCircle, Loader2, User, UserPlus, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const navigate = useNavigate();

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
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário.');

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            role,
          },
        ]);

      if (profileError) throw profileError;

      // 3. Success!
      navigate(`/dashboard/${role}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900 tracking-tight">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500">
          Escolha seu perfil e comece agora mesmo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-stone-200 sm:rounded-3xl sm:px-10 border border-stone-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-start gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-1">
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
                  className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-3">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-1 gap-3">
                {!adminExists && (
                  <button
                    type="button"
                    onClick={() => setRole('adm')}
                    className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                      role === 'adm'
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <ShieldCheck className={`h-6 w-6 ${role === 'adm' ? 'text-indigo-600' : 'text-stone-400'}`} />
                    <div className="text-left">
                      <div className={`font-bold text-sm ${role === 'adm' ? 'text-indigo-900' : 'text-stone-900'}`}>Administrador</div>
                      <div className="text-xs text-stone-500">Acesso total ao sistema</div>
                    </div>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setRole('produtor')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'produtor'
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <ShoppingBag className={`h-6 w-6 ${role === 'produtor' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'produtor' ? 'text-indigo-900' : 'text-stone-900'}`}>Produtor</div>
                    <div className="text-xs text-stone-500">Crie e venda seus produtos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('afiliado')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'afiliado'
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <UserPlus className={`h-6 w-6 ${role === 'afiliado' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'afiliado' ? 'text-indigo-900' : 'text-stone-900'}`}>Afiliado</div>
                    <div className="text-xs text-stone-500">Promova produtos e ganhe comissão</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('cliente')}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${
                    role === 'cliente'
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <User className={`h-6 w-6 ${role === 'cliente' ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="text-left">
                    <div className={`font-bold text-sm ${role === 'cliente' ? 'text-indigo-900' : 'text-stone-900'}`}>Cliente</div>
                    <div className="text-xs text-stone-500">Compre e acesse seus conteúdos</div>
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
            <p className="text-sm text-stone-500">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
