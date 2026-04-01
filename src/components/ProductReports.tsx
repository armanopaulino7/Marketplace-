import React, { useEffect, useState } from 'react';
import { Flag, Trash2, Check, ExternalLink, AlertTriangle, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Report {
  id: string;
  reporter_id: string;
  product_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  produtos: {
    name: string;
    image_url: string;
    producer_id: string;
  };
}

export function ProductReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('product_reports')
      .select('*, profiles(full_name, email), produtos(name, image_url, producer_id)')
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase
      .from('product_reports')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto permanentemente? Esta ação não pode ser desfeita.')) {
      const { error } = await supabase.from('produtos').delete().eq('id', productId);
      if (!error) {
        alert('Produto excluído com sucesso.');
        fetchReports();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Flag className="h-6 w-6 text-rose-500" />
            Denúncias de Produtos
          </h2>
          <p className="text-sm text-stone-500">Analise os produtos reportados pelos usuários</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem]" />
          ))
        ) : reports.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-stone-900 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-stone-800">
            <Check className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-stone-500">Nenhuma denúncia pendente. Bom trabalho!</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className={cn(
              "bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border transition-all flex flex-col md:flex-row gap-8",
              report.status === 'pending' ? "border-rose-100 dark:border-rose-900/30 shadow-lg shadow-rose-100/20" : "border-stone-100 dark:border-stone-800 opacity-60"
            )}>
              <div className="h-24 w-24 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0">
                <img src={report.produtos?.image_url} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                      {report.produtos?.name || 'Produto Excluído'}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Por: {report.profiles?.full_name || report.profiles?.email}
                      </span>
                      <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm') : 'Data desconhecida'}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    report.status === 'pending' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                    report.status === 'resolved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                    "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                  )}>
                    {report.status}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <p className="text-sm text-stone-600 dark:text-stone-400 italic">
                    "{report.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link 
                    to={`/product/${report.product_id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl text-xs font-bold hover:bg-stone-200 transition-all"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver Produto
                  </Link>
                  {report.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(report.id, 'resolved')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                      >
                        <Check className="h-3 w-3" />
                        Marcar como Resolvido
                      </button>
                      <button 
                        onClick={() => updateStatus(report.id, 'dismissed')}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-400 text-white rounded-xl text-xs font-bold hover:bg-stone-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                        Ignorar
                      </button>
                      <button 
                        onClick={() => deleteProduct(report.product_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all ml-auto"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Excluir Produto
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
