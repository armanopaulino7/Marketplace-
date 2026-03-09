import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  CheckSquare, 
  Wallet, 
  Clock, 
  Truck, 
  Home as HomeIcon,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900">Dashboard ADM</h1>
              <p className="text-stone-500">Visão geral do sistema e métricas principais.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Usuários Totais', value: '1,284', icon: Users, color: 'bg-blue-50 text-blue-600', trend: '+12%', trendUp: true },
                { label: 'Vendas Mensais', value: 'R$ 45.200', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600', trend: '+8%', trendUp: true },
                { label: 'Saques Pendentes', value: 'R$ 12.850', icon: Wallet, color: 'bg-orange-50 text-orange-600', trend: '-2%', trendUp: false },
                { label: 'Produtos Pendentes', value: '24', icon: CheckSquare, color: 'bg-purple-50 text-purple-600', trend: '+5', trendUp: true },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
                  <div className="text-sm text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-bold text-stone-900">Atividade Recente do Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600">
                        U{i}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-stone-900">Novo usuário registrado</div>
                        <div className="text-xs text-stone-500">Há {i + 1} horas atrás • IP: 192.168.1.{i}</div>
                      </div>
                      <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 uppercase tracking-wider">
                        LOG
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Home</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4">
              <HomeIcon className="h-16 w-16 text-stone-200 mx-auto" />
              <h2 className="text-xl font-bold text-stone-900">Página Inicial do Marketplace</h2>
              <p className="text-stone-500 max-w-md mx-auto">Aqui você pode configurar como a página inicial do marketplace aparece para os visitantes.</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Editar Layout da Home</button>
            </div>
          </div>
        );
      case 'aprovacao-produtos':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Aprovação de Produtos</h1>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-24 w-24 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                    <CheckSquare className="h-10 w-10" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-stone-900 text-lg">Curso de Programação Avançada {i+1}</h3>
                    <p className="text-sm text-stone-500">Produtor: joao@exemplo.com • R$ 497,00</p>
                    <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-lg">Educação</span>
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-lg">Digital</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all">Aprovar</button>
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all">Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'gestao-usuarios':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Gestão de Usuários</h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {['produtor', 'afiliado', 'cliente'].map((role, i) => (
                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">usuario{i}@email.com</div>
                        <div className="text-xs text-stone-500">ID: user_abc123{i}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-lg">{role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-stone-600">Ativo</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 font-bold text-sm hover:underline">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Carteira Administrativa</h1>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Total em Custódia</p>
                <h2 className="text-4xl font-black">R$ 1.245.850,00</h2>
                <div className="mt-6 flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Comissões ADM</p>
                    <p className="text-lg font-bold">R$ 84.200,00</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Taxas de Processamento</p>
                    <p className="text-lg font-bold">R$ 12.450,00</p>
                  </div>
                </div>
              </div>
              <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
            </div>
          </div>
        );
      case 'aprovacao-saque':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Solicitações de Saque</h1>
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-bold text-stone-900">R$ 1.500,00</h3>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold rounded uppercase">Pendente</span>
                    </div>
                    <p className="text-sm text-stone-500">Solicitado por: produtor@exemplo.com • Há 2 dias</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Aprovar Saque</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'taxas-entrega':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Taxas de Entrega</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Configuração de Logística</h2>
                  <p className="text-sm text-stone-500">Defina as taxas padrão para produtos físicos.</p>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Taxa Fixa Nacional</label>
                  <input type="text" defaultValue="R$ 15,00" className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Taxa por Região (SP/RJ)</label>
                  <input type="text" defaultValue="R$ 10,00" className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button className="w-full bg-stone-900 text-white py-3 rounded-2xl font-bold hover:bg-stone-800 transition-all">Salvar Alterações</button>
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Seu Perfil</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                  A
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">Administrador Master</h2>
                  <p className="text-stone-500">adm@marketplace.com</p>
                  <span className="mt-2 inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest">Acesso Total</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <Settings className="h-5 w-5" />
                  Configurações
                </button>
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <UserIcon className="h-5 w-5" />
                  Editar Dados
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
