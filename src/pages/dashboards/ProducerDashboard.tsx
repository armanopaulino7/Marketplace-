import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Package, 
  TrendingUp, 
  Users, 
  Plus, 
  ClipboardList, 
  Wallet, 
  Home as HomeIcon,
  User as UserIcon,
  PlusCircle,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';

export default function ProducerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900">Dashboard Produtor</h1>
                <p className="text-stone-500">Gerencie seus produtos e acompanhe suas vendas.</p>
              </div>
              <button 
                onClick={() => setActiveTab('cadastrar-produto')}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
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
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
                  <div className="text-sm text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Seus Produtos Mais Vendidos</h2>
                <div className="space-y-4">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-stone-100 rounded-2xl hover:border-indigo-100 transition-all">
                      <div className="h-16 w-16 bg-stone-100 rounded-xl flex items-center justify-center">
                        <Package className="h-8 w-8 text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-stone-900">Curso de Marketing Digital {i+1}</div>
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

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Solicitações de Afiliação</h2>
                <div className="space-y-4 text-center py-12">
                  <div className="bg-stone-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-stone-300" />
                  </div>
                  <p className="text-stone-500 text-sm">Nenhuma solicitação pendente no momento.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Home</h1>
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4">
              <HomeIcon className="h-16 w-16 text-stone-200 mx-auto" />
              <h2 className="text-xl font-bold text-stone-900">Vitrine do Produtor</h2>
              <p className="text-stone-500 max-w-md mx-auto">Visualize como seus produtos aparecem para os clientes no marketplace.</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Ver Minha Loja</button>
            </div>
          </div>
        );
      case 'cadastrar-produto':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Cadastrar Produto</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Nome do Produto</label>
                    <input type="text" placeholder="Ex: Curso de Design" className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Preço (R$)</label>
                    <input type="number" placeholder="0,00" className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Categoria</label>
                    <select className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option>Educação</option>
                      <option>Saúde</option>
                      <option>Tecnologia</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Descrição</label>
                    <textarea rows={5} placeholder="Descreva seu produto..." className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                  </div>
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Criar Produto
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Pedidos</h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Vendas Recentes</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full">Todos</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">Pagos</span>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">Pedido #ORD-{1000 + i}</div>
                        <div className="text-sm text-stone-500">Cliente: maria@email.com • Há {i + 1}h</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-stone-900">R$ 197,00</div>
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Aprovado</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Sua Carteira</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-stone-400 text-sm font-medium mb-1">Saldo Disponível para Saque</p>
                  <h2 className="text-4xl font-black">R$ 8.450,00</h2>
                  <button className="mt-8 bg-white text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-stone-100 transition-all">Solicitar Saque</button>
                </div>
                <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-6">Histórico de Saques</h3>
                <div className="space-y-4">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div>
                        <div className="font-bold text-stone-900">R$ 2.000,00</div>
                        <div className="text-xs text-stone-500">15/02/2024 • Transferência Bancária</div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg">Concluído</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Perfil do Produtor</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600">
                  P
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">João Produtor</h2>
                  <p className="text-stone-500">joao@exemplo.com</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">Verificado</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">Nível 5</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400" />
                    Dados Cadastrais
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <Wallet className="h-5 w-5 text-stone-400" />
                  Dados Bancários
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
