import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface RankingItem {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  total_sales: number;
  total_commission: number;
}

export function AffiliateRanking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('affiliate_ranking')
      .select('*')
      .limit(10);
    
    if (data) setRanking(data);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Top Afiliados
          </h2>
          <p className="text-sm text-stone-500">Os maiores vendedores da plataforma</p>
        </div>
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Atualizado agora
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Posição</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Afiliado</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Vendas</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Comissão Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 h-16 bg-stone-50/50 dark:bg-stone-800/20" />
                  </tr>
                ))
              ) : ranking.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-stone-400">
                    Nenhum dado disponível ainda.
                  </td>
                </tr>
              ) : (
                ranking.map((item, index) => (
                  <tr key={item.user_id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-sm">
                        {index === 0 ? <Medal className="h-6 w-6 text-amber-500" /> :
                         index === 1 ? <Medal className="h-6 w-6 text-stone-400" /> :
                         index === 2 ? <Medal className="h-6 w-6 text-orange-400" /> :
                         <span className="text-stone-400">#{index + 1}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                              {item.full_name?.[0] || item.email?.[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.full_name || item.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-stone-400">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-bold text-stone-600 dark:text-stone-400">
                        <Users className="h-3 w-3" />
                        {item.total_sales}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {item.total_commission.toLocaleString()} KZ
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
