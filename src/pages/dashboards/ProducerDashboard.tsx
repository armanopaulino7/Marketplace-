import React from 'react';
import { Package, TrendingUp, Users, Plus } from 'lucide-react';

export default function ProducerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-stone-900">Painel do Produtor</h1>
          <p className="text-stone-500">Gerencie seus produtos e acompanhe suas vendas.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="h-5 w-5" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Produtos Ativos', value: '12', icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Receita Total', value: 'R$ 12.450', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Afiliados', value: '48', icon: Users, color: 'bg-purple-50 text-purple-600' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Seus Produtos</h2>
          <div className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border border-stone-100 rounded-xl">
                <div className="h-16 w-16 bg-stone-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-stone-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-stone-900">Curso de Marketing Digital {i+1}</div>
                  <div className="text-sm text-stone-500">R$ 197,00</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">24 vendas</div>
                  <div className="text-xs text-stone-400">Ativo</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Solicitações de Afiliação</h2>
          <div className="space-y-4 text-center py-8">
            <Users className="h-12 w-12 text-stone-300 mx-auto" />
            <p className="text-stone-500">Nenhuma solicitação pendente no momento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
