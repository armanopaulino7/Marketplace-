import React from 'react';
import { AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';

export function ConfigWarning() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] p-10 shadow-2xl border border-stone-100 dark:border-stone-800 text-center space-y-8">
        <div className="inline-flex p-6 bg-amber-50 dark:bg-amber-900/20 rounded-full">
          <ShieldAlert className="h-12 w-12 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Configuração Necessária
          </h1>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
            As variáveis de ambiente do Supabase não foram encontradas. Você precisa configurar o projeto para continuar.
          </p>
        </div>

        <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Vá para as <strong>Configurações</strong> do AI Studio.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Adicione <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          Já configurei, recarregar
        </button>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
          <a 
            href="https://supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-indigo-600 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Documentação do Supabase
          </a>
        </div>
      </div>
    </div>
  );
}
