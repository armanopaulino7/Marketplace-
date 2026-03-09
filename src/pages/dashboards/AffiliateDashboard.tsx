import React from 'react';
import { Link as LinkIcon, DollarSign, Target, Award } from 'lucide-react';

export default function AffiliateDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-stone-900">Painel do Afiliado</h1>
        <p className="text-stone-500">Promova produtos e ganhe comissões.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Comissão Pendente', value: 'R$ 850,00', icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
          { label: 'Cliques Totais', value: '1,420', icon: Target, color: 'bg-blue-50 text-blue-600' },
          { label: 'Nível', value: 'Prata', icon: Award, color: 'bg-indigo-50 text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
            <div className="text-sm text-stone-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">Produtos para Promover</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="p-4 border border-stone-100 rounded-2xl hover:border-indigo-200 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
                  <LinkIcon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-500 uppercase font-bold">Comissão</div>
                  <div className="text-lg font-bold text-emerald-600">50%</div>
                </div>
              </div>
              <h3 className="font-bold text-stone-900 mb-1">Ebook: Guia de Investimentos</h3>
              <p className="text-sm text-stone-500 mb-4 line-clamp-2">Aprenda a investir do zero com este guia completo e prático.</p>
              <button className="w-full py-2 bg-stone-100 text-stone-700 rounded-xl font-medium group-hover:bg-indigo-600 group-hover:text-white transition-all">
                Pegar Link de Afiliado
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
