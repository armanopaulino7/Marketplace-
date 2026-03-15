import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setSuccess(true);
      setPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Lock className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Segurança da Conta</h2>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">Atualize sua senha de acesso para manter sua conta segura.</p>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>Senha atualizada com sucesso!</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Nova Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua nova senha" 
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
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

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Atualizar Senha'}
        </button>
      </form>
    </div>
  );
}
