import React from 'react';
import { Shield, Users, BarChart3, Settings } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-stone-900">Painel do Administrador</h1>
        <p className="text-stone-500">Bem-vindo ao centro de controle do marketplace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Usuários Totais', value: '1,284', icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Vendas Mensais', value: 'R$ 45.200', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Segurança', value: 'Ativa', icon: Shield, color: 'bg-purple-50 text-purple-600' },
          { label: 'Configurações', value: 'OK', icon: Settings, color: 'bg-orange-50 text-orange-600' },
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

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Atividade Recente</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600">
                  U{i}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-900">Novo usuário registrado</div>
                  <div className="text-xs text-stone-500">Há {i + 1} horas atrás</div>
                </div>
                <div className="text-xs font-semibold px-2 py-1 rounded bg-stone-200 text-stone-700 uppercase">
                  Log
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
