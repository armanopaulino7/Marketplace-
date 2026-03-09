import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { 
  ShoppingBag, 
  Heart, 
  Clock, 
  Star, 
  Home as HomeIcon,
  User as UserIcon,
  ClipboardList,
  Search,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900">Olá, Cliente!</h1>
              <p className="text-stone-500">Acesse suas compras e gerencie seus favoritos.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Minhas Compras', value: '5', icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600' },
                { label: 'Favoritos', value: '12', icon: Heart, color: 'bg-rose-50 text-rose-600' },
                { label: 'Horas de Estudo', value: '24h', icon: Clock, color: 'bg-amber-50 text-amber-600' },
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

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Meus Cursos</h2>
                <button 
                  onClick={() => setActiveTab('pedidos')}
                  className="text-sm text-indigo-600 font-bold hover:underline"
                >
                  Ver todos
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-4 group cursor-pointer">
                      <div className="h-32 w-full sm:w-48 bg-stone-200 rounded-2xl flex-shrink-0 overflow-hidden relative">
                        <img 
                          src={`https://picsum.photos/seed/course${i}/400/300`} 
                          alt="Course" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <PlayCircle className="h-12 w-12 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm font-bold">
                          {i * 25}% CONCLUÍDO
                        </div>
                      </div>
                      <div className="flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-stone-900 text-lg group-hover:text-indigo-600 transition-colors">Masterclass de Design UI/UX {i+1}</h3>
                          <p className="text-sm text-stone-500 line-clamp-2">Domine as ferramentas e processos de design modernos.</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
                            Continuar Assistindo
                          </button>
                          <button className="p-2.5 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                            <Heart className="h-5 w-5" />
                          </button>
                        </div>
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
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-6">
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="O que você quer aprender hoje?" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Design', 'Marketing', 'Programação', 'Negócios'].map((cat, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-indigo-200 transition-all cursor-pointer">
                    <div className="font-bold text-stone-900 text-sm">{cat}</div>
                  </div>
                ))}
              </div>
              <div className="pt-8">
                <h2 className="text-xl font-bold text-stone-900 mb-6">Recomendados para Você</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left group">
                      <div className="h-40 bg-stone-200 relative">
                        <img src={`https://picsum.photos/seed/shop${i}/400/300`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-indigo-600">
                          R$ 97,00
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-stone-900 mb-2 group-hover:text-indigo-600 transition-colors">Curso de Estratégia Digital</h3>
                        <div className="flex items-center gap-1 text-amber-400 mb-4">
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-[10px] text-stone-400 font-bold ml-1">(4.9)</span>
                        </div>
                        <button className="w-full py-2.5 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800 transition-all">
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Meus Pedidos</h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
              <div className="divide-y divide-stone-100">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">Pedido #ORD-{5000 + i}</div>
                        <p className="text-sm text-stone-500">Curso de Fotografia Profissional • 12/02/2024</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Concluído</span>
                          <span className="text-[10px] text-stone-400 font-bold">R$ 297,00</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-6 py-2.5 border border-stone-200 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
                      Ver Recibo
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
                  C
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">Carlos Cliente</h2>
                  <p className="text-stone-500">carlos@exemplo.com</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">Membro desde 2024</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400" />
                    Meus Dados
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-stone-400" />
                    Minhas Avaliações
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-300" />
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
