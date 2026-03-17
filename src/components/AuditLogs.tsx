import React, { useEffect, useState } from 'react';
import { History, User, Calendar, Shield, Activity, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setLogs(data);
    setIsLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-500" />
            Logs de Auditoria
          </h2>
          <p className="text-sm text-stone-500">Acompanhe todas as ações importantes no sistema</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Filtrar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Data/Hora</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Usuário</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ação</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Entidade</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">ID Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-16 bg-stone-50/50 dark:bg-stone-800/20" />
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-stone-400">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-900 dark:text-white">
                          {format(new Date(log.created_at), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900 dark:text-white">
                            {log.profiles?.full_name || 'Sistema'}
                          </p>
                          <p className="text-[10px] text-stone-400">{log.profiles?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        log.action.includes('INSERT') ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                        log.action.includes('UPDATE') ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                        "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                        <Activity className="h-3 w-3" />
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                        {log.entity_id.slice(0, 8)}...
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
