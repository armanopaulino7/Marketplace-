import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export function NetworkError() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] p-10 shadow-2xl border border-stone-100 dark:border-stone-800 text-center space-y-8">
        <div className="inline-flex p-6 bg-rose-50 dark:bg-rose-900/20 rounded-full">
          <WifiOff className="h-12 w-12 text-rose-600 dark:text-rose-400" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Erro de Conexão
          </h1>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.
          </p>
        </div>

        <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 text-left space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Isso pode ser causado por um firewall, bloqueador de anúncios ou problemas temporários no Supabase.
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Tentar Novamente
        </button>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Verifique o status do Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
